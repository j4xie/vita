/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.service;

import com.ruoyi.system.domain.VolunteerManHour;
import java.util.List;

public interface IVolunteerManHourService {
    public VolunteerManHour selectVolunteerManHourByUserId(Long var1);

    public List<VolunteerManHour> selectVolunteerManHourList(VolunteerManHour var1);

    public List<VolunteerManHour> selectVolunteerManHourListForApp(VolunteerManHour var1);

    public int insertVolunteerManHour(VolunteerManHour var1);

    public int updateVolunteerManHour(VolunteerManHour var1);

    public int deleteVolunteerManHourByUserIds(Long[] var1);

    public int deleteVolunteerManHourByUserId(Long var1);
}

