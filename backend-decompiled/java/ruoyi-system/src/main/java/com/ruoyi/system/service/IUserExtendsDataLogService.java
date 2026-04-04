/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.UserExtendsDataLog
 */
package com.ruoyi.system.service;

import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import java.util.List;

public interface IUserExtendsDataLogService {
    public List<UserExtendsDataLog> selectUserExtendsDataLogByUserId(Long var1);

    public List<UserExtendsDataLog> selectUserExtendsDataLogList(UserExtendsDataLog var1);

    public int insertUserExtendsDataLog(UserExtendsDataLog var1);

    public int updateUserExtendsDataLog(UserExtendsDataLog var1);

    public int deleteUserExtendsDataLogByUserIds(Long[] var1);

    public int deleteUserExtendsDataLogByUserId(Long var1);
}

