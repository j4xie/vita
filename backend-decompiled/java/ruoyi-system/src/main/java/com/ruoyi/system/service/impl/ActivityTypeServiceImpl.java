/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.ActivityType;
import com.ruoyi.system.mapper.ActivityTypeMapper;
import com.ruoyi.system.service.IActivityTypeService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ActivityTypeServiceImpl
implements IActivityTypeService {
    @Autowired
    private ActivityTypeMapper activityTypeMapper;

    @Override
    public ActivityType selectActivityTypeById(Long id) {
        return this.activityTypeMapper.selectActivityTypeById(id);
    }

    @Override
    public List<ActivityType> selectActivityTypeList(ActivityType activityType) {
        return this.activityTypeMapper.selectActivityTypeList(activityType);
    }

    @Override
    public int insertActivityType(ActivityType activityType) {
        activityType.setCreateTime(DateUtils.getNowDate());
        return this.activityTypeMapper.insertActivityType(activityType);
    }

    @Override
    public int updateActivityType(ActivityType activityType) {
        return this.activityTypeMapper.updateActivityType(activityType);
    }

    @Override
    public int deleteActivityTypeByIds(Long[] ids) {
        return this.activityTypeMapper.deleteActivityTypeByIds(ids);
    }

    @Override
    public int deleteActivityTypeById(Long id) {
        return this.activityTypeMapper.deleteActivityTypeById(id);
    }
}

