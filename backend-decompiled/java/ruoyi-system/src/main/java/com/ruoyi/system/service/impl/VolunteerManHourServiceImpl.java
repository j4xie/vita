/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.DataScope
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.annotation.DataScope;
import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.mapper.VolunteerManHourMapper;
import com.ruoyi.system.service.IVolunteerManHourService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VolunteerManHourServiceImpl
implements IVolunteerManHourService {
    @Autowired
    private VolunteerManHourMapper volunteerManHourMapper;

    @Override
    public VolunteerManHour selectVolunteerManHourByUserId(Long userId) {
        return this.volunteerManHourMapper.selectVolunteerManHourByUserId(userId);
    }

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<VolunteerManHour> selectVolunteerManHourList(VolunteerManHour volunteerManHour) {
        return this.volunteerManHourMapper.selectVolunteerManHourList(volunteerManHour);
    }

    @Override
    public List<VolunteerManHour> selectVolunteerManHourListForApp(VolunteerManHour volunteerManHour) {
        return this.volunteerManHourMapper.selectVolunteerManHourListForApp(volunteerManHour);
    }

    @Override
    public int insertVolunteerManHour(VolunteerManHour volunteerManHour) {
        return this.volunteerManHourMapper.insertVolunteerManHour(volunteerManHour);
    }

    @Override
    public int updateVolunteerManHour(VolunteerManHour volunteerManHour) {
        return this.volunteerManHourMapper.updateVolunteerManHour(volunteerManHour);
    }

    @Override
    public int deleteVolunteerManHourByUserIds(Long[] userIds) {
        return this.volunteerManHourMapper.deleteVolunteerManHourByUserIds(userIds);
    }

    @Override
    public int deleteVolunteerManHourByUserId(Long userId) {
        return this.volunteerManHourMapper.deleteVolunteerManHourByUserId(userId);
    }
}

