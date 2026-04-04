/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysDictData
 */
package com.ruoyi.system.service;

import com.ruoyi.common.core.domain.entity.SysDictData;
import java.util.List;

public interface ISysDictDataService {
    public List<SysDictData> selectDictDataList(SysDictData var1);

    public String selectDictLabel(String var1, String var2);

    public SysDictData selectDictDataById(Long var1);

    public void deleteDictDataByIds(Long[] var1);

    public int insertDictData(SysDictData var1);

    public int updateDictData(SysDictData var1);
}

