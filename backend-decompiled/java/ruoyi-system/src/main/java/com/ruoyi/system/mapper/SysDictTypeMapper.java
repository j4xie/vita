/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysDictType
 */
package com.ruoyi.system.mapper;

import com.ruoyi.common.core.domain.entity.SysDictType;
import java.util.List;

public interface SysDictTypeMapper {
    public List<SysDictType> selectDictTypeList(SysDictType var1);

    public List<SysDictType> selectDictTypeAll();

    public SysDictType selectDictTypeById(Long var1);

    public SysDictType selectDictTypeByType(String var1);

    public int deleteDictTypeById(Long var1);

    public int deleteDictTypeByIds(Long[] var1);

    public int insertDictType(SysDictType var1);

    public int updateDictType(SysDictType var1);

    public SysDictType checkDictTypeUnique(String var1);
}

