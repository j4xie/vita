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
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.mapper.SysUserExLevelMapper;
import com.ruoyi.system.mapper.SysUserLevelMapper;
import com.ruoyi.system.service.ISysUserExLevelService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysUserExLevelServiceImpl
implements ISysUserExLevelService {
    @Autowired
    private SysUserExLevelMapper sysUserExLevelMapper;
    @Autowired
    private SysUserLevelMapper sysUserLevelMapper;

    @Override
    public SysUserExLevel selectSysUserExLevelById(Long id) {
        return this.sysUserExLevelMapper.selectSysUserExLevelById(id);
    }

    @Override
    public SysUserExLevel selectSysUserExLevelByUserId(Long userId) {
        return this.sysUserExLevelMapper.selectSysUserExLevelByUserId(userId);
    }

    @Override
    public List<SysUserExLevel> selectSysUserExLevelList(SysUserExLevel sysUserExLevel) {
        return this.sysUserExLevelMapper.selectSysUserExLevelList(sysUserExLevel);
    }

    @Override
    public int insertSysUserExLevel(SysUserExLevel sysUserExLevel) {
        sysUserExLevel.setCreateTime(DateUtils.getNowDate());
        return this.sysUserExLevelMapper.insertSysUserExLevel(sysUserExLevel);
    }

    @Override
    public int updateSysUserExLevel(SysUserExLevel sysUserExLevel) {
        return this.sysUserExLevelMapper.updateSysUserExLevel(sysUserExLevel);
    }

    @Override
    public int deleteSysUserExLevelByIds(Long[] ids) {
        return this.sysUserExLevelMapper.deleteSysUserExLevelByIds(ids);
    }

    @Override
    public int deleteSysUserExLevelById(Long id) {
        return this.sysUserExLevelMapper.deleteSysUserExLevelById(id);
    }

    @Override
    public int registerSendUserLevel(SysUserExLevel sysUserExLevel) {
        int count = 0;
        SysUserLevel sysUserLevel = new SysUserLevel();
        sysUserLevel.setAcquisitionMethodType("register_get");
        List<SysUserLevel> levelList = this.sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
        if (levelList.size() <= 0) {
            count = -1;
            return count;
        }
        SysUserExLevel sysUserExLevelDTO = new SysUserExLevel();
        sysUserExLevelDTO.setUserId(sysUserExLevel.getUserId());
        sysUserExLevelDTO.setStatus(1L);
        sysUserExLevelDTO.setValidityType(1L);
        List<SysUserExLevel> list = this.sysUserExLevelMapper.selectSysUserExLevelList(sysUserExLevelDTO);
        if (list.size() > 0) {
            for (int i = 0; i < list.size(); ++i) {
                this.sysUserExLevelMapper.deleteSysUserExLevelById(list.get(i).getId());
            }
        }
        SysUserLevel sysUserLevelVO = levelList.get(levelList.size() - 1);
        sysUserExLevel.setLevelId(sysUserLevelVO.getId());
        sysUserExLevel.setStatus(1L);
        sysUserExLevel.setValidityType(1L);
        count = this.sysUserExLevelMapper.insertSysUserExLevel(sysUserExLevel);
        return count;
    }

    @Override
    public int verifyEmailSendUserLevel(SysUserExLevel sysUserExLevel) {
        int count = 0;
        SysUserLevel sysUserLevel = new SysUserLevel();
        sysUserLevel.setAcquisitionMethodType("verify_email_get");
        List<SysUserLevel> levelList = this.sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
        if (levelList.size() <= 0) {
            count = -1;
            return count;
        }
        SysUserExLevel sysUserExLevelDTO = new SysUserExLevel();
        sysUserExLevelDTO.setUserId(sysUserExLevel.getUserId());
        sysUserExLevelDTO.setStatus(1L);
        sysUserExLevelDTO.setValidityType(1L);
        List<SysUserExLevel> list = this.sysUserExLevelMapper.selectSysUserExLevelList(sysUserExLevelDTO);
        boolean isNeedUpdate = true;
        if (list.size() > 0) {
            for (int i = 0; i < list.size(); ++i) {
                if (list.get(i).getId() < levelList.get(0).getId()) {
                    this.sysUserExLevelMapper.deleteSysUserExLevelById(list.get(i).getId());
                    continue;
                }
                isNeedUpdate = false;
            }
        }
        if (isNeedUpdate) {
            SysUserLevel sysUserLevelVO = levelList.get(levelList.size() - 1);
            sysUserExLevel.setLevelId(sysUserLevelVO.getId());
            sysUserExLevel.setStatus(1L);
            sysUserExLevel.setValidityType(1L);
            count = this.sysUserExLevelMapper.insertSysUserExLevel(sysUserExLevel);
        }
        return count;
    }
}

