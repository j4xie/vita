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
import com.ruoyi.system.domain.EquityData;
import com.ruoyi.system.mapper.EquityDataMapper;
import com.ruoyi.system.service.IEquityDataService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EquityDataServiceImpl
implements IEquityDataService {
    @Autowired
    private EquityDataMapper equityDataMapper;

    @Override
    public EquityData selectEquityDataById(Long id) {
        return this.equityDataMapper.selectEquityDataById(id);
    }

    @Override
    public EquityData selectEquityDataByTag(String equTag) {
        return this.equityDataMapper.selectEquityDataByTag(equTag);
    }

    @Override
    public List<EquityData> selectEquityDataList(EquityData equityData) {
        return this.equityDataMapper.selectEquityDataList(equityData);
    }

    @Override
    public int insertEquityData(EquityData equityData) {
        equityData.setCreateTime(DateUtils.getNowDate());
        return this.equityDataMapper.insertEquityData(equityData);
    }

    @Override
    public int updateEquityData(EquityData equityData) {
        equityData.setUpdateTime(DateUtils.getNowDate());
        return this.equityDataMapper.updateEquityData(equityData);
    }

    @Override
    public int deleteEquityDataByIds(Long[] ids) {
        return this.equityDataMapper.deleteEquityDataByIds(ids);
    }

    @Override
    public int deleteEquityDataById(Long id) {
        return this.equityDataMapper.deleteEquityDataById(id);
    }
}

