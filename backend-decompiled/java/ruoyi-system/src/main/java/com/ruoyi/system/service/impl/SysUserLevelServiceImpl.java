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
import com.ruoyi.system.domain.EquityData;
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.domain.UserLevelExEquity;
import com.ruoyi.system.mapper.EquityDataMapper;
import com.ruoyi.system.mapper.SysUserLevelMapper;
import com.ruoyi.system.mapper.UserLevelExEquityMapper;
import com.ruoyi.system.service.ISysUserLevelService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SysUserLevelServiceImpl
implements ISysUserLevelService {
    @Autowired
    private SysUserLevelMapper sysUserLevelMapper;
    @Autowired
    private UserLevelExEquityMapper userLevelExEquityMapper;
    @Autowired
    private EquityDataMapper equityDataMapper;

    @Override
    public SysUserLevel selectSysUserLevelById(Long id) {
        SysUserLevel sysUserLevel = this.sysUserLevelMapper.selectSysUserLevelById(id);
        UserLevelExEquity userLevelExEquity = new UserLevelExEquity();
        userLevelExEquity.setLevelId(sysUserLevel.getId());
        List<UserLevelExEquity> userLevelExEquityList = this.userLevelExEquityMapper.selectUserLevelExEquityList(userLevelExEquity);
        sysUserLevel.setUserLevelExEquityList(userLevelExEquityList);
        Long[] equids = new Long[userLevelExEquityList.size()];
        for (int j = 0; j < userLevelExEquityList.size(); ++j) {
            equids[j] = userLevelExEquityList.get(j).getEquityId();
        }
        sysUserLevel.setEquids(equids);
        return sysUserLevel;
    }

    @Override
    public List<SysUserLevel> selectSysUserLevelList(SysUserLevel sysUserLevel) {
        List<SysUserLevel> sysUserLevelList = this.sysUserLevelMapper.selectSysUserLevelList(sysUserLevel);
        for (int i = 0; i < sysUserLevelList.size(); ++i) {
            UserLevelExEquity userLevelExEquity = new UserLevelExEquity();
            userLevelExEquity.setLevelId(sysUserLevelList.get(i).getId());
            List<UserLevelExEquity> userLevelExEquityList = this.userLevelExEquityMapper.selectUserLevelExEquityList(userLevelExEquity);
            sysUserLevelList.get(i).setUserLevelExEquityList(userLevelExEquityList);
            Long[] equids = new Long[userLevelExEquityList.size()];
            for (int j = 0; j < userLevelExEquityList.size(); ++j) {
                equids[j] = userLevelExEquityList.get(j).getEquityId();
            }
            sysUserLevelList.get(i).setEquids(equids);
        }
        return sysUserLevelList;
    }

    @Override
    public int insertSysUserLevel(SysUserLevel sysUserLevel) {
        sysUserLevel.setCreateTime(DateUtils.getNowDate());
        int count = this.sysUserLevelMapper.insertSysUserLevel(sysUserLevel);
        if (count > 0 && sysUserLevel.getEquids().length > 0) {
            for (int i = 0; i < sysUserLevel.getEquids().length; ++i) {
                EquityData equityData = this.equityDataMapper.selectEquityDataById(sysUserLevel.getEquids()[i]);
                UserLevelExEquity userLevelExEquity = new UserLevelExEquity();
                userLevelExEquity.setLevelId(sysUserLevel.getId());
                userLevelExEquity.setEquityId(equityData.getId());
                userLevelExEquity.setEquName(equityData.getEquName());
                userLevelExEquity.setEquTag(equityData.getEquTag());
                userLevelExEquity.setEquSort(equityData.getEquSort());
                userLevelExEquity.setCreateTime(DateUtils.getNowDate());
                this.userLevelExEquityMapper.insertUserLevelExEquity(userLevelExEquity);
            }
        }
        return count;
    }

    @Override
    public int updateSysUserLevel(SysUserLevel sysUserLevel) {
        sysUserLevel.setUpdateTime(DateUtils.getNowDate());
        int count = this.sysUserLevelMapper.updateSysUserLevel(sysUserLevel);
        if (count > 0) {
            this.userLevelExEquityMapper.deleteUserLevelExEquityByLevelId(sysUserLevel.getId());
            if (sysUserLevel.getEquids().length > 0) {
                for (int i = 0; i < sysUserLevel.getEquids().length; ++i) {
                    EquityData equityData = this.equityDataMapper.selectEquityDataById(sysUserLevel.getEquids()[i]);
                    UserLevelExEquity userLevelExEquity = new UserLevelExEquity();
                    userLevelExEquity.setLevelId(sysUserLevel.getId());
                    userLevelExEquity.setEquityId(equityData.getId());
                    userLevelExEquity.setEquName(equityData.getEquName());
                    userLevelExEquity.setEquTag(equityData.getEquTag());
                    userLevelExEquity.setEquSort(equityData.getEquSort());
                    userLevelExEquity.setCreateTime(DateUtils.getNowDate());
                    this.userLevelExEquityMapper.insertUserLevelExEquity(userLevelExEquity);
                }
            }
        }
        return count;
    }

    @Override
    public int deleteSysUserLevelByIds(Long[] ids) {
        return this.sysUserLevelMapper.deleteSysUserLevelByIds(ids);
    }

    @Override
    public int deleteSysUserLevelById(Long id) {
        return this.sysUserLevelMapper.deleteSysUserLevelById(id);
    }
}

