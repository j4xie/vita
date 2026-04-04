/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.PlateformData;
import java.util.List;

public interface PlateformDataMapper {
    public PlateformData selectPlateformDataById(Long var1);

    public List<PlateformData> selectPlateformDataList(PlateformData var1);

    public int insertPlateformData(PlateformData var1);

    public int updatePlateformData(PlateformData var1);

    public int deletePlateformDataById(Long var1);

    public int deletePlateformDataByIds(Long[] var1);
}

