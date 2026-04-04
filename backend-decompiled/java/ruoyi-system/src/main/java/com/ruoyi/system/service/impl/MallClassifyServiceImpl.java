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
import com.ruoyi.system.domain.MallClassify;
import com.ruoyi.system.mapper.MallClassifyMapper;
import com.ruoyi.system.service.IMallClassifyService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MallClassifyServiceImpl
implements IMallClassifyService {
    @Autowired
    private MallClassifyMapper mallClassifyMapper;

    @Override
    public MallClassify selectMallClassifyById(Long id) {
        return this.mallClassifyMapper.selectMallClassifyById(id);
    }

    @Override
    public List<MallClassify> selectMallClassifyList(MallClassify mallClassify) {
        return this.mallClassifyMapper.selectMallClassifyList(mallClassify);
    }

    @Override
    public int insertMallClassify(MallClassify mallClassify) {
        mallClassify.setCreateTime(DateUtils.getNowDate());
        return this.mallClassifyMapper.insertMallClassify(mallClassify);
    }

    @Override
    public int updateMallClassify(MallClassify mallClassify) {
        mallClassify.setUpdateTime(DateUtils.getNowDate());
        return this.mallClassifyMapper.updateMallClassify(mallClassify);
    }

    @Override
    public int deleteMallClassifyByIds(Long[] ids) {
        return this.mallClassifyMapper.deleteMallClassifyByIds(ids);
    }

    @Override
    public int deleteMallClassifyById(Long id) {
        return this.mallClassifyMapper.deleteMallClassifyById(id);
    }
}

