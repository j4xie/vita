/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.vo.ActivityExUserVo;
import com.ruoyi.system.mapper.ActivityExUserMapper;
import com.ruoyi.system.service.IActivityExUserService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ActivityExUserServiceImpl
implements IActivityExUserService {
    @Autowired
    private ActivityExUserMapper activityExUserMapper;

    @Override
    public ActivityExUser selectActivityExUserByActivityId(Long activityId) {
        return this.activityExUserMapper.selectActivityExUserByActivityId(activityId);
    }

    @Override
    public List<ActivityExUser> selectActivityExUserList(ActivityExUser activityExUser) {
        return this.activityExUserMapper.selectActivityExUserList(activityExUser);
    }

    @Override
    public List<ActivityExUserVo> selectActivityExUserVoList(ActivityExUser activityExUser) {
        return this.activityExUserMapper.selectActivityExUserVoList(activityExUser);
    }

    @Override
    public int insertActivityExUser(ActivityExUser activityExUser) {
        return this.activityExUserMapper.insertActivityExUser(activityExUser);
    }

    @Override
    public int updateActivityExUser(ActivityExUser activityExUser) {
        return this.activityExUserMapper.updateActivityExUser(activityExUser);
    }

    @Override
    public int deleteActivityExUserByActivityIds(Long[] activityIds) {
        return this.activityExUserMapper.deleteActivityExUserByActivityIds(activityIds);
    }

    @Override
    public int deleteActivityRegist(ActivityExUser activityExUser) {
        return this.activityExUserMapper.deleteActivityRegist(activityExUser);
    }

    @Override
    public int deleteActivityExUserByActivityId(Long activityId) {
        return this.activityExUserMapper.deleteActivityExUserByActivityId(activityId);
    }
}

