/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.ActivityModel;
import java.util.List;

public interface IActivityModelService {
    public ActivityModel selectActivityModelById(Long var1);

    public List<ActivityModel> selectActivityModelList(ActivityModel var1);

    public int insertActivityModel(ActivityModel var1);

    public int updateActivityModel(ActivityModel var1);

    public int deleteActivityModelByIds(Long[] var1);

    public int deleteActivityModelById(Long var1);
}

