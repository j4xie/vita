/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.CouponVerifyLog;
import com.ruoyi.system.mapper.CouponVerifyLogMapper;
import com.ruoyi.system.service.ICouponVerifyLogService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CouponVerifyLogServiceImpl
implements ICouponVerifyLogService {
    @Autowired
    private CouponVerifyLogMapper couponVerifyLogMapper;

    @Override
    public CouponVerifyLog selectCouponVerifyLogById(Long id) {
        return this.couponVerifyLogMapper.selectCouponVerifyLogById(id);
    }

    @Override
    public CouponVerifyLog selectCouponVerifyLogByUserCouponId(Long userCouponId) {
        return this.couponVerifyLogMapper.selectCouponVerifyLogByUserCouponId(userCouponId);
    }

    @Override
    public List<CouponVerifyLog> selectCouponVerifyLogList(CouponVerifyLog couponVerifyLog) {
        return this.couponVerifyLogMapper.selectCouponVerifyLogList(couponVerifyLog);
    }

    @Override
    public int insertCouponVerifyLog(CouponVerifyLog couponVerifyLog) {
        couponVerifyLog.setCreateTime(DateUtils.getNowDate());
        return this.couponVerifyLogMapper.insertCouponVerifyLog(couponVerifyLog);
    }

    @Override
    public int updateCouponVerifyLog(CouponVerifyLog couponVerifyLog) {
        return this.couponVerifyLogMapper.updateCouponVerifyLog(couponVerifyLog);
    }

    @Override
    public int deleteCouponVerifyLogByIds(Long[] ids) {
        return this.couponVerifyLogMapper.deleteCouponVerifyLogByIds(ids);
    }

    @Override
    public int deleteCouponVerifyLogById(Long id) {
        return this.couponVerifyLogMapper.deleteCouponVerifyLogById(id);
    }
}

