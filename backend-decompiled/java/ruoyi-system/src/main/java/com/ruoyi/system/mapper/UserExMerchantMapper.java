/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import java.util.List;

public interface UserExMerchantMapper {
    public UserExMerchant selectUserExMerchantById(Long var1);

    public UserExMerchant selectUserExMerchantByUserId(Long var1);

    public List<UserExMerchant> selectUserExMerchantList(UserExMerchant var1);

    public int insertUserExMerchant(UserExMerchant var1);

    public int updateUserExMerchant(UserExMerchant var1);

    public int auditUserExMerchant(UserExMerchant var1, UserExMerchantAuditLog var2);

    public int deleteUserExMerchantById(Long var1);

    public int deleteUserExMerchantByIds(Long[] var1);
}

