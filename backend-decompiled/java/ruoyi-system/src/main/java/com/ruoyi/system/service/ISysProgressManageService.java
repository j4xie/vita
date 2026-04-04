/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.SysProgressManage;
import java.util.List;

public interface ISysProgressManageService {
    public SysProgressManage selectSysProgressManageById(Long var1);

    public List<SysProgressManage> selectSysProgressManageList(SysProgressManage var1);

    public int insertSysProgressManage(SysProgressManage var1);

    public int updateSysProgressManage(SysProgressManage var1);

    public int deleteSysProgressManageByIds(Long[] var1);

    public int deleteSysProgressManageById(Long var1);
}

