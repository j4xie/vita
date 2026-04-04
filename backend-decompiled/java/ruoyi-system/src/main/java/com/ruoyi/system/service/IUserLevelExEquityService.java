/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.UserLevelExEquity;
import java.util.List;

public interface IUserLevelExEquityService {
    public UserLevelExEquity selectUserLevelExEquityByLevelId(Long var1);

    public List<UserLevelExEquity> selectUserLevelExEquityList(UserLevelExEquity var1);

    public int insertUserLevelExEquity(UserLevelExEquity var1);

    public int updateUserLevelExEquity(UserLevelExEquity var1);

    public int deleteUserLevelExEquityByLevelIds(Long[] var1);

    public int deleteUserLevelExEquityByLevelId(Long var1);
}

