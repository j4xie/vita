/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysUserExLevel;
import java.util.List;

public interface ISysUserExLevelService {
    public SysUserExLevel selectSysUserExLevelById(Long var1);

    public SysUserExLevel selectSysUserExLevelByUserId(Long var1);

    public List<SysUserExLevel> selectSysUserExLevelList(SysUserExLevel var1);

    public int insertSysUserExLevel(SysUserExLevel var1);

    public int updateSysUserExLevel(SysUserExLevel var1);

    public int deleteSysUserExLevelByIds(Long[] var1);

    public int deleteSysUserExLevelById(Long var1);

    public int registerSendUserLevel(SysUserExLevel var1);

    public int verifyEmailSendUserLevel(SysUserExLevel var1);
}

