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
import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.mapper.SysCouponMapper;
import com.ruoyi.system.service.ISysCouponService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysCouponServiceImpl
implements ISysCouponService {
    @Autowired
    private SysCouponMapper sysCouponMapper;

    @Override
    public SysCoupon selectSysCouponById(Long id) {
        return this.sysCouponMapper.selectSysCouponById(id);
    }

    @Override
    public List<SysCoupon> selectSysCouponList(SysCoupon sysCoupon) {
        return this.sysCouponMapper.selectSysCouponList(sysCoupon);
    }

    @Override
    public int insertSysCoupon(SysCoupon sysCoupon) {
        sysCoupon.setCreateTime(DateUtils.getNowDate());
        int count = this.sysCouponMapper.insertSysCoupon(sysCoupon);
        return count;
    }

    @Override
    public int updateSysCoupon(SysCoupon sysCoupon) {
        return this.sysCouponMapper.updateSysCoupon(sysCoupon);
    }

    @Override
    public int deleteSysCouponByIds(Long[] ids) {
        return this.sysCouponMapper.deleteSysCouponByIds(ids);
    }

    @Override
    public int deleteSysCouponById(Long id) {
        return this.sysCouponMapper.deleteSysCouponById(id);
    }
}

