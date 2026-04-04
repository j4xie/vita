/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.SysProgressManage;
import com.ruoyi.system.mapper.SysProgressManageMapper;
import com.ruoyi.system.service.ISysProgressManageService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysProgressManageServiceImpl
implements ISysProgressManageService {
    @Autowired
    private SysProgressManageMapper sysProgressManageMapper;

    @Override
    public SysProgressManage selectSysProgressManageById(Long id) {
        return this.sysProgressManageMapper.selectSysProgressManageById(id);
    }

    @Override
    public List<SysProgressManage> selectSysProgressManageList(SysProgressManage sysProgressManage) {
        return this.sysProgressManageMapper.selectSysProgressManageList(sysProgressManage);
    }

    @Override
    public int insertSysProgressManage(SysProgressManage sysProgressManage) {
        return this.sysProgressManageMapper.insertSysProgressManage(sysProgressManage);
    }

    @Override
    public int updateSysProgressManage(SysProgressManage sysProgressManage) {
        return this.sysProgressManageMapper.updateSysProgressManage(sysProgressManage);
    }

    @Override
    public int deleteSysProgressManageByIds(Long[] ids) {
        return this.sysProgressManageMapper.deleteSysProgressManageByIds(ids);
    }

    @Override
    public int deleteSysProgressManageById(Long id) {
        return this.sysProgressManageMapper.deleteSysProgressManageById(id);
    }
}

