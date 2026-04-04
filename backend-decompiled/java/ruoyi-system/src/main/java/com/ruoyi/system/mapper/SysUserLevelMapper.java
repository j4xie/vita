/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysUserLevel;
import java.util.List;

public interface SysUserLevelMapper {
    public SysUserLevel selectSysUserLevelById(Long var1);

    public List<SysUserLevel> selectSysUserLevelList(SysUserLevel var1);

    public int insertSysUserLevel(SysUserLevel var1);

    public int updateSysUserLevel(SysUserLevel var1);

    public int deleteSysUserLevelById(Long var1);

    public int deleteSysUserLevelByIds(Long[] var1);
}

