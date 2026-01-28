package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.*;
import com.ruoyi.system.mapper.*;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.service.ISysOrderService;

/**
 * 订单Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
@Service
public class SysOrderServiceImpl implements ISysOrderService 
{
    @Autowired
    private SysOrderMapper sysOrderMapper;

    @Autowired
    private SysUserAddressMapper sysUserAddressMapper;

    @Autowired
    private MallPointGoodsMapper mallPointGoodsMapper;

    @Autowired
    private ActivityMapper activityMapper;

    @Autowired
    private UserExtendsDataMapper userExtendsDataMapper;

    @Autowired
    private ActivityExUserMapper activityExUserMapper;

    /**
     * 查询订单
     * 
     * @param id 订单主键
     * @return 订单
     */
    @Override
    public SysOrder selectSysOrderById(Long id)
    {
        return sysOrderMapper.selectSysOrderById(id);
    }

    /**
     * 查询订单
     *
     * @param orderNo 订单编号
     * @return 订单
     */
    @Override
    public SysOrder selectSysOrderByOrderNo(String orderNo) {
        return sysOrderMapper.selectSysOrderByOrderNo(orderNo);
    }

    /**
     * 查询订单列表
     * 
     * @param sysOrder 订单
     * @return 订单
     */
    @Override
    public List<SysOrder> selectSysOrderList(SysOrder sysOrder)
    {
        return sysOrderMapper.selectSysOrderList(sysOrder);
    }

    /**
     * 新增订单
     * 
     * @param sysOrder 订单
     * @return 结果
     */
    @Override
    public int insertSysOrder(SysOrder sysOrder)
    {
        if(null != sysOrder){
            //生成订单号
            String orderNo = "ON" + CommonUtils.genRandomNum(4) + System.currentTimeMillis() + CommonUtils.genRandomNum(4);
            sysOrder.setOrderNo(orderNo);
            sysOrder.setCreateTime(DateUtils.getNowDate());

            if(null != sysOrder.getAddrId()){
                //获取地址信息
                SysUserAddress sysUserAddress = sysUserAddressMapper.selectSysUserAddressById(sysOrder.getAddrId());
                if(null != sysUserAddress){
                    sysOrder.setReceivingName(sysUserAddress.getName());
                    sysOrder.setReceivingMobile(sysUserAddress.getMobile());
                    sysOrder.setIntAreaCode(sysUserAddress.getIntAreaCode());
                    sysOrder.setReceivingAddress(sysUserAddress.getAddress() + sysUserAddress.getDetailAddr());
                    sysOrder.setLongitude(sysUserAddress.getLongitude());
                    sysOrder.setLatitude(sysUserAddress.getLatitude());
                }

                //订单类型（1-积分商城消费   2-活动支付    3-会员等级支付）
                if(1 == sysOrder.getOrderType()){
                    if (null != sysOrder.getGoodsId()) {
                        MallPointGoods mallPointGoods = mallPointGoodsMapper.selectMallPointGoodsById(sysOrder.getGoodsId());
                        if(null != mallPointGoods){
                            sysOrder.setTitle(mallPointGoods.getGoodName());
                            sysOrder.setOrderDesc("兑换积分商品：" + mallPointGoods.getGoodName() + " x" + sysOrder.getNum() + (!TextUtils.isEmpty(mallPointGoods.getUnit()) ? mallPointGoods.getUnit() : ""));
                        }
                    }
                    sysOrder.setOrderStatus(5L);
                }else if(2 == sysOrder.getOrderType()){
                    if(null != sysOrder.getActivityId()){
                        Activity activity = activityMapper.selectActivityById(sysOrder.getActivityId());
                        if(null != activity){
                            sysOrder.setTitle(activity.getName());
                            sysOrder.setOrderDesc("参与活动：" + activity.getName());
                        }
                    }
                    sysOrder.setOrderStatus(1L);
                }else if(3 == sysOrder.getOrderType()){
                    sysOrder.setTitle("红卡会员");
                    sysOrder.setOrderDesc("购买红卡会员");
                    sysOrder.setOrderStatus(1L);
                }
            }

        }

        return sysOrderMapper.insertSysOrder(sysOrder);
    }

    /**
     * 修改订单
     * 
     * @param sysOrder 订单
     * @return 结果
     */
    @Override
    public int updateSysOrder(SysOrder sysOrder)
    {
        return sysOrderMapper.updateSysOrder(sysOrder);
    }

    /**
     * 取消订单
     * @param orderId
     * @return
     */
    public int cancelOrder(Long orderId, String cancelReason)
    {
        int count= 0;
        SysOrder sysOrder = sysOrderMapper.selectSysOrderById(orderId);
        if(null != sysOrder && !sysOrder.getOrderStatus().equals(1L)){
            count = -2;
            return count;
        }

        SysOrder sysOrderVo = new SysOrder();
        sysOrderVo.setId(orderId);
        sysOrderVo.setOrderStatus(3L);
        sysOrderVo.setCancelReason(cancelReason);
        sysOrderVo.setCancelTime(DateUtils.getNowDate());
        count = sysOrderMapper.updateSysOrder(sysOrderVo);
        if(count > 0){
            if(sysOrder.getOrderType() == 1){//按现在的逻辑不会出现这种情况
                //积分兑换商品，需退回商品库存，退回用户积分
                MallPointGoods mallPointGoods = new MallPointGoods();
                mallPointGoods.setId(sysOrder.getGoodsId());
                mallPointGoods.setQuantity(Long.valueOf(sysOrder.getNum()));
                mallPointGoodsMapper.refundGoodsQuantity(mallPointGoods);

                UserExtendsData userExtendsData = new UserExtendsData();
                userExtendsData.setUserId(sysOrder.getCreateById());
                userExtendsData.setUserPoint(sysOrder.getPrice());
                userExtendsDataMapper.refundUserPoint(userExtendsData);
            }else if(sysOrder.getOrderType() == 2){
                //参与活动，需退回活动名额
                ActivityExUser activityExUser = new ActivityExUser();
                activityExUser.setActivityId(sysOrder.getActivityId());
                activityExUser.setUserId(sysOrder.getCreateById());
                activityExUserMapper.deleteActivityRegist(activityExUser);
            }
        }

        return count;
    }

    /**
     * 批量删除订单
     * 
     * @param ids 需要删除的订单主键
     * @return 结果
     */
    @Override
    public int deleteSysOrderByIds(Long[] ids)
    {
        return sysOrderMapper.deleteSysOrderByIds(ids);
    }

    /**
     * 删除订单信息
     * 
     * @param id 订单主键
     * @return 结果
     */
    @Override
    public int deleteSysOrderById(Long id)
    {
        return sysOrderMapper.deleteSysOrderById(id);
    }
}
