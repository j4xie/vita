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
import com.ruoyi.system.domain.MallPointGoods;
import com.ruoyi.system.mapper.MallPointGoodsMapper;
import com.ruoyi.system.service.IMallPointGoodsService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MallPointGoodsServiceImpl
implements IMallPointGoodsService {
    @Autowired
    private MallPointGoodsMapper mallPointGoodsMapper;

    @Override
    public MallPointGoods selectMallPointGoodsById(Long id) {
        return this.mallPointGoodsMapper.selectMallPointGoodsById(id);
    }

    @Override
    public List<MallPointGoods> selectMallPointGoodsList(MallPointGoods mallPointGoods) {
        return this.mallPointGoodsMapper.selectMallPointGoodsList(mallPointGoods);
    }

    @Override
    public int insertMallPointGoods(MallPointGoods mallPointGoods) {
        mallPointGoods.setCreateTime(DateUtils.getNowDate());
        return this.mallPointGoodsMapper.insertMallPointGoods(mallPointGoods);
    }

    @Override
    public int updateMallPointGoods(MallPointGoods mallPointGoods) {
        mallPointGoods.setUpdateTime(DateUtils.getNowDate());
        return this.mallPointGoodsMapper.updateMallPointGoods(mallPointGoods);
    }

    @Override
    public int refundGoodsQuantity(MallPointGoods mallPointGoods) {
        mallPointGoods.setUpdateTime(DateUtils.getNowDate());
        return this.mallPointGoodsMapper.refundGoodsQuantity(mallPointGoods);
    }

    @Override
    public int deleteMallPointGoodsByIds(Long[] ids) {
        return this.mallPointGoodsMapper.deleteMallPointGoodsByIds(ids);
    }

    @Override
    public int deleteMallPointGoodsById(Long id) {
        return this.mallPointGoodsMapper.deleteMallPointGoodsById(id);
    }
}

