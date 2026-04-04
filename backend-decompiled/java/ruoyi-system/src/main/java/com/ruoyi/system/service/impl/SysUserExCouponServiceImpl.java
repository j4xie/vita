/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.enums.UserCouponStatus
 *  com.ruoyi.common.utils.CommonUtils
 *  com.ruoyi.common.utils.DateUtils
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.BeanUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.enums.UserCouponStatus;
import com.ruoyi.common.utils.CommonUtils;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.domain.SysUserExCoupon;
import com.ruoyi.system.mapper.SysCouponMapper;
import com.ruoyi.system.mapper.SysUserExCouponMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import com.ruoyi.system.service.ISysUserExCouponService;
import java.util.List;
import org.apache.http.util.TextUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysUserExCouponServiceImpl
implements ISysUserExCouponService {
    @Autowired
    private SysUserExCouponMapper sysUserExCouponMapper;
    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysCouponMapper sysCouponMapper;

    @Override
    public SysUserExCoupon selectSysUserExCouponById(Long id) {
        return this.sysUserExCouponMapper.selectSysUserExCouponById(id);
    }

    @Override
    public SysUserExCoupon selectSysUserExCouponByNo(String couponNo) {
        return this.sysUserExCouponMapper.selectSysUserExCouponByNo(couponNo);
    }

    @Override
    public List<SysUserExCoupon> selectSysUserExCouponList(SysUserExCoupon sysUserExCoupon) {
        return this.sysUserExCouponMapper.selectSysUserExCouponList(sysUserExCoupon);
    }

    @Override
    public List<SysUserExCoupon> selectCanUseCouponList(SysUserExCoupon sysUserExCoupon) {
        return this.sysUserExCouponMapper.selectCanUseCouponList(sysUserExCoupon);
    }

    @Override
    public int insertSysUserExCoupon(SysUserExCoupon sysUserExCoupon) {
        sysUserExCoupon.setCreateTime(DateUtils.getNowDate());
        return this.sysUserExCouponMapper.insertSysUserExCoupon(sysUserExCoupon);
    }

    @Override
    public int updateSysUserExCoupon(SysUserExCoupon sysUserExCoupon) {
        return this.sysUserExCouponMapper.updateSysUserExCoupon(sysUserExCoupon);
    }

    @Override
    public int writeOffUserCoupon(SysUserExCoupon sysUserExCoupon) {
        return this.sysUserExCouponMapper.writeOffUserCoupon(sysUserExCoupon);
    }

    @Override
    public int deleteSysUserExCouponByIds(Long[] ids) {
        return this.sysUserExCouponMapper.deleteSysUserExCouponByIds(ids);
    }

    @Override
    public int deleteSysUserExCouponById(Long id) {
        return this.sysUserExCouponMapper.deleteSysUserExCouponById(id);
    }

    @Override
    public int issueCoupons(SysUserExCoupon sysUserExCoupon, String phonenumber) {
        if (TextUtils.isEmpty((CharSequence)phonenumber)) {
            return 0;
        }
        SysCoupon sysCoupon = this.sysCouponMapper.selectSysCouponById(sysUserExCoupon.getCouponId());
        if (sysCoupon.getQuantity() <= 0L) {
            return -1;
        }
        SysCoupon sysCouponDtO = new SysCoupon();
        sysCouponDtO.setId(sysUserExCoupon.getCouponId());
        sysCouponDtO.setQuantity(sysCoupon.getQuantity() - 1L);
        this.sysCouponMapper.updateSysCoupon(sysCouponDtO);
        BeanUtils.copyProperties((Object)((Object)sysCoupon), (Object)((Object)sysUserExCoupon));
        sysUserExCoupon.setId(null);
        sysUserExCoupon.setQuantity(1L);
        SysUser sysUser = this.userMapper.selectUserByPhoneNumber(phonenumber);
        if (null == sysUser || null == sysUser.getUserId()) {
            return -2;
        }
        sysUserExCoupon.setUserId(sysUser.getUserId());
        if (TextUtils.isEmpty((CharSequence)sysUserExCoupon.getCouponNo())) {
            String code = "Q" + CommonUtils.genRandomNum((int)2) + System.currentTimeMillis() + CommonUtils.genRandomNum((int)3);
            sysUserExCoupon.setCouponNo(code);
        }
        sysUserExCoupon.setStatus(UserCouponStatus.CANUSE.getValue());
        sysUserExCoupon.setCreateTime(DateUtils.getNowDate());
        return this.sysUserExCouponMapper.insertSysUserExCoupon(sysUserExCoupon);
    }

    @Override
    public int issueCoupons(SysUserExCoupon sysUserExCoupon) {
        if (null == sysUserExCoupon.getUserId()) {
            return 0;
        }
        SysCoupon sysCoupon = this.sysCouponMapper.selectSysCouponById(sysUserExCoupon.getCouponId());
        if (sysCoupon.getQuantity() <= 0L) {
            return -1;
        }
        SysCoupon sysCouponDtO = new SysCoupon();
        sysCouponDtO.setId(sysUserExCoupon.getCouponId());
        sysCouponDtO.setQuantity(sysCoupon.getQuantity() - 1L);
        this.sysCouponMapper.updateSysCoupon(sysCouponDtO);
        BeanUtils.copyProperties((Object)((Object)sysCoupon), (Object)((Object)sysUserExCoupon));
        sysUserExCoupon.setId(null);
        sysUserExCoupon.setQuantity(1L);
        if (TextUtils.isEmpty((CharSequence)sysUserExCoupon.getCouponNo())) {
            String code = "Q" + CommonUtils.genRandomNum((int)1) + System.currentTimeMillis() + CommonUtils.genRandomNum((int)1);
            sysUserExCoupon.setCouponNo(code);
        }
        sysUserExCoupon.setCreateTime(DateUtils.getNowDate());
        return this.sysUserExCouponMapper.insertSysUserExCoupon(sysUserExCoupon);
    }

    private void checkCouponInfo() {
    }
}

