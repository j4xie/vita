/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.MallPointGoods;
import java.util.List;

public interface MallPointGoodsMapper {
    public MallPointGoods selectMallPointGoodsById(Long var1);

    public List<MallPointGoods> selectMallPointGoodsList(MallPointGoods var1);

    public int insertMallPointGoods(MallPointGoods var1);

    public int updateMallPointGoods(MallPointGoods var1);

    public int refundGoodsQuantity(MallPointGoods var1);

    public int deleteMallPointGoodsById(Long var1);

    public int deleteMallPointGoodsByIds(Long[] var1);
}

