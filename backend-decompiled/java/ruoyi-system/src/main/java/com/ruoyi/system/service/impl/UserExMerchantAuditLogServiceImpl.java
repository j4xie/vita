/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.mapper.UserExMerchantAuditLogMapper;
import com.ruoyi.system.service.IUserExMerchantAuditLogService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserExMerchantAuditLogServiceImpl
implements IUserExMerchantAuditLogService {
    @Autowired
    private UserExMerchantAuditLogMapper userExMerchantAuditLogMapper;

    @Override
    public UserExMerchantAuditLog selectUserExMerchantAuditLogById(Long id) {
        return this.userExMerchantAuditLogMapper.selectUserExMerchantAuditLogById(id);
    }

    @Override
    public List<UserExMerchantAuditLog> selectUserExMerchantAuditLogList(UserExMerchantAuditLog userExMerchantAuditLog) {
        return this.userExMerchantAuditLogMapper.selectUserExMerchantAuditLogList(userExMerchantAuditLog);
    }

    @Override
    public int insertUserExMerchantAuditLog(UserExMerchantAuditLog userExMerchantAuditLog) {
        return this.userExMerchantAuditLogMapper.insertUserExMerchantAuditLog(userExMerchantAuditLog);
    }

    @Override
    public int updateUserExMerchantAuditLog(UserExMerchantAuditLog userExMerchantAuditLog) {
        return this.userExMerchantAuditLogMapper.updateUserExMerchantAuditLog(userExMerchantAuditLog);
    }

    @Override
    public int deleteUserExMerchantAuditLogByIds(Long[] ids) {
        return this.userExMerchantAuditLogMapper.deleteUserExMerchantAuditLogByIds(ids);
    }

    @Override
    public int deleteUserExMerchantAuditLogById(Long id) {
        return this.userExMerchantAuditLogMapper.deleteUserExMerchantAuditLogById(id);
    }
}

