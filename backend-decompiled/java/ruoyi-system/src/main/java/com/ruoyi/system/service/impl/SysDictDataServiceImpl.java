/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysDictData
 *  com.ruoyi.common.utils.DictUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.core.domain.entity.SysDictData;
import com.ruoyi.common.utils.DictUtils;
import com.ruoyi.system.mapper.SysDictDataMapper;
import com.ruoyi.system.service.ISysDictDataService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysDictDataServiceImpl
implements ISysDictDataService {
    @Autowired
    private SysDictDataMapper dictDataMapper;

    @Override
    public List<SysDictData> selectDictDataList(SysDictData dictData) {
        return this.dictDataMapper.selectDictDataList(dictData);
    }

    @Override
    public String selectDictLabel(String dictType, String dictValue) {
        return this.dictDataMapper.selectDictLabel(dictType, dictValue);
    }

    @Override
    public SysDictData selectDictDataById(Long dictCode) {
        return this.dictDataMapper.selectDictDataById(dictCode);
    }

    @Override
    public void deleteDictDataByIds(Long[] dictCodes) {
        for (Long dictCode : dictCodes) {
            SysDictData data = this.selectDictDataById(dictCode);
            this.dictDataMapper.deleteDictDataById(dictCode);
            List<SysDictData> dictDatas = this.dictDataMapper.selectDictDataByType(data.getDictType());
            DictUtils.setDictCache((String)data.getDictType(), dictDatas);
        }
    }

    @Override
    public int insertDictData(SysDictData data) {
        int row = this.dictDataMapper.insertDictData(data);
        if (row > 0) {
            List<SysDictData> dictDatas = this.dictDataMapper.selectDictDataByType(data.getDictType());
            DictUtils.setDictCache((String)data.getDictType(), dictDatas);
        }
        return row;
    }

    @Override
    public int updateDictData(SysDictData data) {
        int row = this.dictDataMapper.updateDictData(data);
        if (row > 0) {
            List<SysDictData> dictDatas = this.dictDataMapper.selectDictDataByType(data.getDictType());
            DictUtils.setDictCache((String)data.getDictType(), dictDatas);
        }
        return row;
    }
}

