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
import com.ruoyi.system.domain.ActivityModel;
import com.ruoyi.system.mapper.ActivityModelMapper;
import com.ruoyi.system.service.IActivityModelService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ActivityModelServiceImpl
implements IActivityModelService {
    @Autowired
    private ActivityModelMapper activityModelMapper;

    @Override
    public ActivityModel selectActivityModelById(Long id) {
        return this.activityModelMapper.selectActivityModelById(id);
    }

    @Override
    public List<ActivityModel> selectActivityModelList(ActivityModel activityModel) {
        return this.activityModelMapper.selectActivityModelList(activityModel);
    }

    @Override
    public int insertActivityModel(ActivityModel activityModel) {
        activityModel.setCreateTime(DateUtils.getNowDate());
        return this.activityModelMapper.insertActivityModel(activityModel);
    }

    @Override
    public int updateActivityModel(ActivityModel activityModel) {
        activityModel.setUpdateTime(DateUtils.getNowDate());
        return this.activityModelMapper.updateActivityModel(activityModel);
    }

    @Override
    public int deleteActivityModelByIds(Long[] ids) {
        return this.activityModelMapper.deleteActivityModelByIds(ids);
    }

    @Override
    public int deleteActivityModelById(Long id) {
        return this.activityModelMapper.deleteActivityModelById(id);
    }
}

