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
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.mapper.VolunteerRecordMapper;
import com.ruoyi.system.service.IVolunteerRecordService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VolunteerRecordServiceImpl
implements IVolunteerRecordService {
    @Autowired
    private VolunteerRecordMapper volunteerRecordMapper;

    @Override
    public VolunteerRecord selectVolunteerRecordById(Long id) {
        return this.volunteerRecordMapper.selectVolunteerRecordById(id);
    }

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<VolunteerRecord> selectVolunteerRecordList(VolunteerRecord volunteerRecord) {
        return this.volunteerRecordMapper.selectVolunteerRecordList(volunteerRecord);
    }

    @Override
    public List<VolunteerRecord> selectVolunteerRecordListFroApp(VolunteerRecord volunteerRecord) {
        return this.volunteerRecordMapper.selectVolunteerRecordListFroApp(volunteerRecord);
    }

    @Override
    public VolunteerRecord selectVolunteerLastRecordFroApp(VolunteerRecord volunteerRecord) {
        return this.volunteerRecordMapper.selectVolunteerLastRecordFroApp(volunteerRecord);
    }

    @Override
    public int insertVolunteerRecord(VolunteerRecord volunteerRecord) {
        return this.volunteerRecordMapper.insertVolunteerRecord(volunteerRecord);
    }

    @Override
    public int updateVolunteerRecord(VolunteerRecord volunteerRecord) {
        return this.volunteerRecordMapper.updateVolunteerRecord(volunteerRecord);
    }

    @Override
    public int deleteVolunteerRecordByIds(Long[] ids) {
        return this.volunteerRecordMapper.deleteVolunteerRecordByIds(ids);
    }

    @Override
    public int deleteVolunteerRecordById(Long id) {
        return this.volunteerRecordMapper.deleteVolunteerRecordById(id);
    }
}

