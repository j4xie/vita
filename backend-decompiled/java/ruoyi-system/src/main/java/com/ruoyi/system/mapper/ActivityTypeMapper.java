/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.ActivityType;
import java.util.List;

public interface ActivityTypeMapper {
    public ActivityType selectActivityTypeById(Long var1);

    public List<ActivityType> selectActivityTypeList(ActivityType var1);

    public int insertActivityType(ActivityType var1);

    public int updateActivityType(ActivityType var1);

    public int deleteActivityTypeById(Long var1);

    public int deleteActivityTypeByIds(Long[] var1);
}

