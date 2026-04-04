/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.Activity;
import java.util.List;

public interface ActivityMapper {
    public Activity selectActivityById(Long var1);

    public List<Activity> selectActivityList(Activity var1);

    public List<Activity> selectActivityListForApp(Activity var1);

    public List<Activity> selectActivityListByUser(Activity var1);

    public int insertActivity(Activity var1);

    public int updateActivity(Activity var1);

    public int deleteActivityById(Long var1);

    public int deleteActivityByIds(Long[] var1);
}

