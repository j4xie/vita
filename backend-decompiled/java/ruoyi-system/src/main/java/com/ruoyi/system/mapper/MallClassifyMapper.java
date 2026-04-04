/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.MallClassify;
import java.util.List;

public interface MallClassifyMapper {
    public MallClassify selectMallClassifyById(Long var1);

    public List<MallClassify> selectMallClassifyList(MallClassify var1);

    public int insertMallClassify(MallClassify var1);

    public int updateMallClassify(MallClassify var1);

    public int deleteMallClassifyById(Long var1);

    public int deleteMallClassifyByIds(Long[] var1);
}

