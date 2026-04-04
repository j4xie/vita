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
import com.ruoyi.system.domain.PlateformData;
import com.ruoyi.system.mapper.PlateformDataMapper;
import com.ruoyi.system.service.IPlateformDataService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlateformDataServiceImpl
implements IPlateformDataService {
    @Autowired
    private PlateformDataMapper plateformDataMapper;

    @Override
    public PlateformData selectPlateformDataById(Long id) {
        return this.plateformDataMapper.selectPlateformDataById(id);
    }

    @Override
    public List<PlateformData> selectPlateformDataList(PlateformData plateformData) {
        return this.plateformDataMapper.selectPlateformDataList(plateformData);
    }

    @Override
    public int insertPlateformData(PlateformData plateformData) {
        plateformData.setCreateTime(DateUtils.getNowDate());
        return this.plateformDataMapper.insertPlateformData(plateformData);
    }

    @Override
    public int updatePlateformData(PlateformData plateformData) {
        plateformData.setUpdateTime(DateUtils.getNowDate());
        return this.plateformDataMapper.updatePlateformData(plateformData);
    }

    @Override
    public int deletePlateformDataByIds(Long[] ids) {
        return this.plateformDataMapper.deletePlateformDataByIds(ids);
    }

    @Override
    public int deletePlateformDataById(Long id) {
        return this.plateformDataMapper.deletePlateformDataById(id);
    }
}

