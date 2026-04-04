/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.EquityData;
import java.util.List;

public interface IEquityDataService {
    public EquityData selectEquityDataById(Long var1);

    public EquityData selectEquityDataByTag(String var1);

    public List<EquityData> selectEquityDataList(EquityData var1);

    public int insertEquityData(EquityData var1);

    public int updateEquityData(EquityData var1);

    public int deleteEquityDataByIds(Long[] var1);

    public int deleteEquityDataById(Long var1);
}

