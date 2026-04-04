/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.CouponVerifyLog;
import java.util.List;

public interface ICouponVerifyLogService {
    public CouponVerifyLog selectCouponVerifyLogById(Long var1);

    public CouponVerifyLog selectCouponVerifyLogByUserCouponId(Long var1);

    public List<CouponVerifyLog> selectCouponVerifyLogList(CouponVerifyLog var1);

    public int insertCouponVerifyLog(CouponVerifyLog var1);

    public int updateCouponVerifyLog(CouponVerifyLog var1);

    public int deleteCouponVerifyLogByIds(Long[] var1);

    public int deleteCouponVerifyLogById(Long var1);
}

