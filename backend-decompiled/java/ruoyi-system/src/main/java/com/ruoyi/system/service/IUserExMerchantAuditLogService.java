/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.UserExMerchantAuditLog;
import java.util.List;

public interface IUserExMerchantAuditLogService {
    public UserExMerchantAuditLog selectUserExMerchantAuditLogById(Long var1);

    public List<UserExMerchantAuditLog> selectUserExMerchantAuditLogList(UserExMerchantAuditLog var1);

    public int insertUserExMerchantAuditLog(UserExMerchantAuditLog var1);

    public int updateUserExMerchantAuditLog(UserExMerchantAuditLog var1);

    public int deleteUserExMerchantAuditLogByIds(Long[] var1);

    public int deleteUserExMerchantAuditLogById(Long var1);
}

