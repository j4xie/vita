/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.DataScope
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.annotation.DataScope;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.mapper.ActivityMapper;
import com.ruoyi.system.service.IActivityService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ActivityServiceImpl
implements IActivityService {
    @Autowired
    private ActivityMapper activityMapper;

    @Override
    public Activity selectActivityById(Long id) {
        return this.activityMapper.selectActivityById(id);
    }

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<Activity> selectActivityList(Activity activity) {
        return this.activityMapper.selectActivityList(activity);
    }

    @Override
    public List<Activity> selectActivityListForApp(Activity activity) {
        return this.activityMapper.selectActivityListForApp(activity);
    }

    @Override
    public List<Activity> selectActivityListByUser(Activity activity) {
        return this.activityMapper.selectActivityListByUser(activity);
    }

    @Override
    public int insertActivity(Activity activity) {
        activity.setCreateTime(DateUtils.getNowDate());
        return this.activityMapper.insertActivity(activity);
    }

    @Override
    public int updateActivity(Activity activity) {
        activity.setUpdateTime(DateUtils.getNowDate());
        return this.activityMapper.updateActivity(activity);
    }

    @Override
    public int deleteActivityByIds(Long[] ids) {
        return this.activityMapper.deleteActivityByIds(ids);
    }

    @Override
    public int deleteActivityById(Long id) {
        return this.activityMapper.deleteActivityById(id);
    }
}

