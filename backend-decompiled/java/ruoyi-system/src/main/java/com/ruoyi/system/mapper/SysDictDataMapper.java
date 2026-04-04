/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysDictData
 *  org.apache.ibatis.annotations.Param
 */
package com.ruoyi.system.mapper;

import com.ruoyi.common.core.domain.entity.SysDictData;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface SysDictDataMapper {
    public List<SysDictData> selectDictDataList(SysDictData var1);

    public List<SysDictData> selectDictDataByType(String var1);

    public String selectDictLabel(@Param(value="dictType") String var1, @Param(value="dictValue") String var2);

    public SysDictData selectDictDataById(Long var1);

    public int countDictDataByType(String var1);

    public int deleteDictDataById(Long var1);

    public int deleteDictDataByIds(Long[] var1);

    public int insertDictData(SysDictData var1);

    public int updateDictData(SysDictData var1);

    public int updateDictDataType(@Param(value="oldDictType") String var1, @Param(value="newDictType") String var2);
}

