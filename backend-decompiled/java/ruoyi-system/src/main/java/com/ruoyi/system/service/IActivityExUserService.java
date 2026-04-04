/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.vo.ActivityExUserVo;
import java.util.List;

public interface IActivityExUserService {
    public ActivityExUser selectActivityExUserByActivityId(Long var1);

    public List<ActivityExUser> selectActivityExUserList(ActivityExUser var1);

    public List<ActivityExUserVo> selectActivityExUserVoList(ActivityExUser var1);

    public int insertActivityExUser(ActivityExUser var1);

    public int updateActivityExUser(ActivityExUser var1);

    public int deleteActivityExUserByActivityIds(Long[] var1);

    public int deleteActivityRegist(ActivityExUser var1);

    public int deleteActivityExUserByActivityId(Long var1);
}

