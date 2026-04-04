/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.UserExtendsData;
import java.util.List;

public interface IUserExtendsDataService {
    public UserExtendsData selectUserExtendsDataByUserId(Long var1);

    public List<UserExtendsData> selectUserExtendsDataList(UserExtendsData var1);

    public int insertUserExtendsData(UserExtendsData var1);

    public int updateUserExtendsData(UserExtendsData var1);

    public int refundUserPoint(UserExtendsData var1);

    public int addUserPoint(UserExtendsData var1);

    public int deleteUserExtendsDataByUserIds(Long[] var1);

    public int deleteUserExtendsDataByUserId(Long var1);
}

