/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.UserExtendsDataLog
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.mapper.UserExtendsDataLogMapper;
import com.ruoyi.system.service.IUserExtendsDataLogService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserExtendsDataLogServiceImpl
implements IUserExtendsDataLogService {
    @Autowired
    private UserExtendsDataLogMapper userExtendsDataLogMapper;

    @Override
    public List<UserExtendsDataLog> selectUserExtendsDataLogByUserId(Long userId) {
        return this.userExtendsDataLogMapper.selectUserExtendsDataLogByUserId(userId);
    }

    @Override
    public List<UserExtendsDataLog> selectUserExtendsDataLogList(UserExtendsDataLog userExtendsDataLog) {
        return this.userExtendsDataLogMapper.selectUserExtendsDataLogList(userExtendsDataLog);
    }

    @Override
    public int insertUserExtendsDataLog(UserExtendsDataLog userExtendsDataLog) {
        userExtendsDataLog.setCreateTime(DateUtils.getNowDate());
        return this.userExtendsDataLogMapper.insertUserExtendsDataLog(userExtendsDataLog);
    }

    @Override
    public int updateUserExtendsDataLog(UserExtendsDataLog userExtendsDataLog) {
        return this.userExtendsDataLogMapper.updateUserExtendsDataLog(userExtendsDataLog);
    }

    @Override
    public int deleteUserExtendsDataLogByUserIds(Long[] userIds) {
        return this.userExtendsDataLogMapper.deleteUserExtendsDataLogByUserIds(userIds);
    }

    @Override
    public int deleteUserExtendsDataLogByUserId(Long userId) {
        return this.userExtendsDataLogMapper.deleteUserExtendsDataLogByUserId(userId);
    }
}

