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
import com.ruoyi.system.domain.UserLevelExEquity;
import com.ruoyi.system.mapper.UserLevelExEquityMapper;
import com.ruoyi.system.service.IUserLevelExEquityService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserLevelExEquityServiceImpl
implements IUserLevelExEquityService {
    @Autowired
    private UserLevelExEquityMapper userLevelExEquityMapper;

    @Override
    public UserLevelExEquity selectUserLevelExEquityByLevelId(Long levelId) {
        return this.userLevelExEquityMapper.selectUserLevelExEquityByLevelId(levelId);
    }

    @Override
    public List<UserLevelExEquity> selectUserLevelExEquityList(UserLevelExEquity userLevelExEquity) {
        return this.userLevelExEquityMapper.selectUserLevelExEquityList(userLevelExEquity);
    }

    @Override
    public int insertUserLevelExEquity(UserLevelExEquity userLevelExEquity) {
        userLevelExEquity.setCreateTime(DateUtils.getNowDate());
        return this.userLevelExEquityMapper.insertUserLevelExEquity(userLevelExEquity);
    }

    @Override
    public int updateUserLevelExEquity(UserLevelExEquity userLevelExEquity) {
        return this.userLevelExEquityMapper.updateUserLevelExEquity(userLevelExEquity);
    }

    @Override
    public int deleteUserLevelExEquityByLevelIds(Long[] levelIds) {
        return this.userLevelExEquityMapper.deleteUserLevelExEquityByLevelIds(levelIds);
    }

    @Override
    public int deleteUserLevelExEquityByLevelId(Long levelId) {
        return this.userLevelExEquityMapper.deleteUserLevelExEquityByLevelId(levelId);
    }
}

