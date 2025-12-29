package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.enums.UserCouponStatus;
import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.mapper.SysCouponMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import org.apache.http.util.TextUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysUserExCouponMapper;
import com.ruoyi.system.domain.SysUserExCoupon;
import com.ruoyi.system.service.ISysUserExCouponService;

/**
 * 用户关联优惠券Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-25
 */
@Service
public class SysUserExCouponServiceImpl implements ISysUserExCouponService 
{
    @Autowired
    private SysUserExCouponMapper sysUserExCouponMapper;

    @Autowired
    private SysUserMapper userMapper;

    @Autowired
    private SysCouponMapper sysCouponMapper;

    /**
     * 查询用户关联优惠券
     * 
     * @param id 用户关联优惠券主键
     * @return 用户关联优惠券
     */
    @Override
    public SysUserExCoupon selectSysUserExCouponById(Long id)
    {
        return sysUserExCouponMapper.selectSysUserExCouponById(id);
    }

    /**
     * 根据券码查询优惠券
     * @param couponNo
     * @return
     */
    @Override
    public SysUserExCoupon selectSysUserExCouponByNo(String couponNo)
    {
        return sysUserExCouponMapper.selectSysUserExCouponByNo(couponNo);
    }

    /**
     * 查询用户关联优惠券列表
     * 
     * @param sysUserExCoupon 用户关联优惠券
     * @return 用户关联优惠券
     */
    @Override
    public List<SysUserExCoupon> selectSysUserExCouponList(SysUserExCoupon sysUserExCoupon)
    {
        return sysUserExCouponMapper.selectSysUserExCouponList(sysUserExCoupon);
    }

    /**
     * 查询用户在当前商家可用的券
     * @param sysUserExCoupon
     * @return
     */
    @Override
    public List<SysUserExCoupon> selectCanUseCouponList(SysUserExCoupon sysUserExCoupon){
        return sysUserExCouponMapper.selectCanUseCouponList(sysUserExCoupon);
    }

    /**
     * 新增用户关联优惠券
     * 
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    @Override
    public int insertSysUserExCoupon(SysUserExCoupon sysUserExCoupon)
    {
        sysUserExCoupon.setCreateTime(DateUtils.getNowDate());
        return sysUserExCouponMapper.insertSysUserExCoupon(sysUserExCoupon);
    }

    /**
     * 修改用户关联优惠券
     * 
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    @Override
    public int updateSysUserExCoupon(SysUserExCoupon sysUserExCoupon)
    {
        return sysUserExCouponMapper.updateSysUserExCoupon(sysUserExCoupon);
    }

    /**
     * 核销优惠券
     * @param sysUserExCoupon
     * @return
     */
    @Override
    public int writeOffUserCoupon(SysUserExCoupon sysUserExCoupon)
    {
        return sysUserExCouponMapper.writeOffUserCoupon(sysUserExCoupon);
    }

    /**
     * 批量删除用户关联优惠券
     * 
     * @param ids 需要删除的用户关联优惠券主键
     * @return 结果
     */
    @Override
    public int deleteSysUserExCouponByIds(Long[] ids)
    {
        return sysUserExCouponMapper.deleteSysUserExCouponByIds(ids);
    }

    /**
     * 删除用户关联优惠券信息
     * 
     * @param id 用户关联优惠券主键
     * @return 结果
     */
    @Override
    public int deleteSysUserExCouponById(Long id)
    {
        return sysUserExCouponMapper.deleteSysUserExCouponById(id);
    }

    /**
     * 根据手机号-发放优惠券
     *
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    @Override
    public int issueCoupons(SysUserExCoupon sysUserExCoupon, String phonenumber){
        if(TextUtils.isEmpty(phonenumber)){
            return 0;
        }

        SysCoupon sysCoupon = sysCouponMapper.selectSysCouponById(sysUserExCoupon.getCouponId());
        if(sysCoupon.getQuantity() > 0){
            SysCoupon sysCouponDtO = new SysCoupon();
            sysCouponDtO.setId(sysUserExCoupon.getCouponId());
            sysCouponDtO.setQuantity(sysCoupon.getQuantity() - 1);
            sysCouponMapper.updateSysCoupon(sysCouponDtO);
        }else{
            return -1;
        }

        BeanUtils.copyProperties(sysCoupon, sysUserExCoupon);
        sysUserExCoupon.setId(null);
        sysUserExCoupon.setQuantity(1L);

        SysUser sysUser = userMapper.selectUserByPhoneNumber(phonenumber);
        if(null == sysUser || null == sysUser.getUserId()){
            return -2;
        }
        sysUserExCoupon.setUserId(sysUser.getUserId());
        if(TextUtils.isEmpty(sysUserExCoupon.getCouponNo())){
            //生成券码
            String code = "Q" + CommonUtils.genRandomNum(2) + System.currentTimeMillis() + CommonUtils.genRandomNum(3);// + CommonUtils.getDayStr();
            sysUserExCoupon.setCouponNo(code);
        }
        sysUserExCoupon.setStatus(UserCouponStatus.CANUSE.getValue());
        sysUserExCoupon.setCreateTime(DateUtils.getNowDate());
        return sysUserExCouponMapper.insertSysUserExCoupon(sysUserExCoupon);
    }

    /**
     * 根据userId-发放优惠券
     *
     * @param sysUserExCoupon 用户关联优惠券
     * @return 结果
     */
    @Override
    public int issueCoupons(SysUserExCoupon sysUserExCoupon){
        if(null == sysUserExCoupon.getUserId()){
            return 0;
        }

        SysCoupon sysCoupon = sysCouponMapper.selectSysCouponById(sysUserExCoupon.getCouponId());
        if(sysCoupon.getQuantity() > 0){
            SysCoupon sysCouponDtO = new SysCoupon();
            sysCouponDtO.setId(sysUserExCoupon.getCouponId());
            sysCouponDtO.setQuantity(sysCoupon.getQuantity() - 1);
            sysCouponMapper.updateSysCoupon(sysCouponDtO);
        }else{
            return -1;
        }

        BeanUtils.copyProperties(sysCoupon, sysUserExCoupon);
        sysUserExCoupon.setId(null);
        sysUserExCoupon.setQuantity(1L);

        if(TextUtils.isEmpty(sysUserExCoupon.getCouponNo())){
            //生成券码
            String code = "Q" + CommonUtils.genRandomNum(1) + System.currentTimeMillis() + CommonUtils.genRandomNum(1);//String code = "Q" + CommonUtils.genRandomNum(1) + CommonUtils.getDayStr() + CommonUtils.formatNum(sysCoupon.getId()) + CommonUtils.genRandomNum(2);
            sysUserExCoupon.setCouponNo(code);
        }
        sysUserExCoupon.setCreateTime(DateUtils.getNowDate());
        return sysUserExCouponMapper.insertSysUserExCoupon(sysUserExCoupon);
    }

    private void checkCouponInfo(){

    }
}
