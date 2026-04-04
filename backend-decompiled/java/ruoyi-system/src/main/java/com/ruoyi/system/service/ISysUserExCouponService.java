/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysUserExCoupon;
import java.util.List;

public interface ISysUserExCouponService {
    public SysUserExCoupon selectSysUserExCouponById(Long var1);

    public SysUserExCoupon selectSysUserExCouponByNo(String var1);

    public List<SysUserExCoupon> selectSysUserExCouponList(SysUserExCoupon var1);

    public List<SysUserExCoupon> selectCanUseCouponList(SysUserExCoupon var1);

    public int insertSysUserExCoupon(SysUserExCoupon var1);

    public int updateSysUserExCoupon(SysUserExCoupon var1);

    public int writeOffUserCoupon(SysUserExCoupon var1);

    public int deleteSysUserExCouponByIds(Long[] var1);

    public int deleteSysUserExCouponById(Long var1);

    public int issueCoupons(SysUserExCoupon var1, String var2);

    public int issueCoupons(SysUserExCoupon var1);
}

