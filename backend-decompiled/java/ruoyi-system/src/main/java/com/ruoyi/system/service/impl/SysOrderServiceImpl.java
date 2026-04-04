/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.CommonUtils
 *  com.ruoyi.common.utils.DateUtils
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.MallPointGoods;
import com.ruoyi.system.domain.SysOrder;
import com.ruoyi.system.domain.SysUserAddress;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.mapper.ActivityExUserMapper;
import com.ruoyi.system.mapper.ActivityMapper;
import com.ruoyi.system.mapper.MallPointGoodsMapper;
import com.ruoyi.system.mapper.SysOrderMapper;
import com.ruoyi.system.mapper.SysUserAddressMapper;
import com.ruoyi.system.mapper.UserExtendsDataMapper;
import com.ruoyi.system.service.ISysOrderService;
import java.util.List;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysOrderServiceImpl
implements ISysOrderService {
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

    @Override
    public SysOrder selectSysOrderById(Long id) {
        return this.sysOrderMapper.selectSysOrderById(id);
    }

    @Override
    public SysOrder selectSysOrderByOrderNo(String orderNo) {
        return this.sysOrderMapper.selectSysOrderByOrderNo(orderNo);
    }

    @Override
    public List<SysOrder> selectSysOrderList(SysOrder sysOrder) {
        return this.sysOrderMapper.selectSysOrderList(sysOrder);
    }

    @Override
    public int insertSysOrder(SysOrder sysOrder) {
        if (null != sysOrder) {
            String orderNo = "ON" + CommonUtils.genRandomNum((int)4) + System.currentTimeMillis() + CommonUtils.genRandomNum((int)4);
            sysOrder.setOrderNo(orderNo);
            sysOrder.setCreateTime(DateUtils.getNowDate());
            if (null != sysOrder.getAddrId()) {
                SysUserAddress sysUserAddress = this.sysUserAddressMapper.selectSysUserAddressById(sysOrder.getAddrId());
                if (null != sysUserAddress) {
                    sysOrder.setReceivingName(sysUserAddress.getName());
                    sysOrder.setReceivingMobile(sysUserAddress.getMobile());
                    sysOrder.setIntAreaCode(sysUserAddress.getIntAreaCode());
                    sysOrder.setReceivingAddress(sysUserAddress.getAddress() + sysUserAddress.getDetailAddr());
                    sysOrder.setLongitude(sysUserAddress.getLongitude());
                    sysOrder.setLatitude(sysUserAddress.getLatitude());
                }
                if (1L == sysOrder.getOrderType()) {
                    MallPointGoods mallPointGoods;
                    if (null != sysOrder.getGoodsId() && null != (mallPointGoods = this.mallPointGoodsMapper.selectMallPointGoodsById(sysOrder.getGoodsId()))) {
                        sysOrder.setTitle(mallPointGoods.getGoodName());
                        sysOrder.setOrderDesc("\u5151\u6362\u79ef\u5206\u5546\u54c1\uff1a" + mallPointGoods.getGoodName() + " x" + sysOrder.getNum() + (!TextUtils.isEmpty((CharSequence)mallPointGoods.getUnit()) ? mallPointGoods.getUnit() : ""));
                    }
                    sysOrder.setOrderStatus(5L);
                } else if (2L == sysOrder.getOrderType()) {
                    Activity activity;
                    if (null != sysOrder.getActivityId() && null != (activity = this.activityMapper.selectActivityById(sysOrder.getActivityId()))) {
                        sysOrder.setTitle(activity.getName());
                        sysOrder.setOrderDesc("\u53c2\u4e0e\u6d3b\u52a8\uff1a" + activity.getName());
                    }
                    sysOrder.setOrderStatus(1L);
                } else if (3L == sysOrder.getOrderType()) {
                    sysOrder.setTitle("\u7ea2\u5361\u4f1a\u5458");
                    sysOrder.setOrderDesc("\u8d2d\u4e70\u7ea2\u5361\u4f1a\u5458");
                    sysOrder.setOrderStatus(1L);
                }
            }
        }
        return this.sysOrderMapper.insertSysOrder(sysOrder);
    }

    @Override
    public int updateSysOrder(SysOrder sysOrder) {
        return this.sysOrderMapper.updateSysOrder(sysOrder);
    }

    @Override
    public int cancelOrder(Long orderId, String cancelReason) {
        int count = 0;
        SysOrder sysOrder = this.sysOrderMapper.selectSysOrderById(orderId);
        if (null != sysOrder && !sysOrder.getOrderStatus().equals(1L)) {
            count = -2;
            return count;
        }
        SysOrder sysOrderVo = new SysOrder();
        sysOrderVo.setId(orderId);
        sysOrderVo.setOrderStatus(3L);
        sysOrderVo.setCancelReason(cancelReason);
        sysOrderVo.setCancelTime(DateUtils.getNowDate());
        count = this.sysOrderMapper.updateSysOrder(sysOrderVo);
        if (count > 0) {
            if (sysOrder.getOrderType() == 1L) {
                MallPointGoods mallPointGoods = new MallPointGoods();
                mallPointGoods.setId(sysOrder.getGoodsId());
                mallPointGoods.setQuantity((long)sysOrder.getNum());
                this.mallPointGoodsMapper.refundGoodsQuantity(mallPointGoods);
                UserExtendsData userExtendsData = new UserExtendsData();
                userExtendsData.setUserId(sysOrder.getCreateById());
                userExtendsData.setUserPoint(sysOrder.getPrice());
                this.userExtendsDataMapper.refundUserPoint(userExtendsData);
            } else if (sysOrder.getOrderType() == 2L) {
                ActivityExUser activityExUser = new ActivityExUser();
                activityExUser.setActivityId(sysOrder.getActivityId());
                activityExUser.setUserId(sysOrder.getCreateById());
                this.activityExUserMapper.deleteActivityRegist(activityExUser);
            }
        }
        return count;
    }

    @Override
    public int deleteSysOrderByIds(Long[] ids) {
        return this.sysOrderMapper.deleteSysOrderByIds(ids);
    }

    @Override
    public int deleteSysOrderById(Long id) {
        return this.sysOrderMapper.deleteSysOrderById(id);
    }
}

