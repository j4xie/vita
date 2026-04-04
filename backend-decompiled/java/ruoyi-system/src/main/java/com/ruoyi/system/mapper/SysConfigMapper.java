/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysConfig;
import java.util.List;

public interface SysConfigMapper {
    public SysConfig selectConfig(SysConfig var1);

    public SysConfig selectConfigById(Long var1);

    public List<SysConfig> selectConfigList(SysConfig var1);

    public SysConfig checkConfigKeyUnique(String var1);

    public int insertConfig(SysConfig var1);

    public int updateConfig(SysConfig var1);

    public int deleteConfigById(Long var1);

    public int deleteConfigByIds(Long[] var1);
}

