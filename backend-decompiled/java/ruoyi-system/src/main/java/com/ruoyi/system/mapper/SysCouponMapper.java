/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysCoupon;
import java.util.List;

public interface SysCouponMapper {
    public SysCoupon selectSysCouponById(Long var1);

    public List<SysCoupon> selectSysCouponList(SysCoupon var1);

    public int insertSysCoupon(SysCoupon var1);

    public int updateSysCoupon(SysCoupon var1);

    public int deleteSysCouponById(Long var1);

    public int deleteSysCouponByIds(Long[] var1);
}

