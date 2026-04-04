/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.VolunteerRecord;
import java.util.List;

public interface VolunteerRecordMapper {
    public VolunteerRecord selectVolunteerRecordById(Long var1);

    public List<VolunteerRecord> selectVolunteerRecordList(VolunteerRecord var1);

    public List<VolunteerRecord> selectVolunteerRecordListFroApp(VolunteerRecord var1);

    public VolunteerRecord selectVolunteerLastRecordFroApp(VolunteerRecord var1);

    public int insertVolunteerRecord(VolunteerRecord var1);

    public int updateVolunteerRecord(VolunteerRecord var1);

    public int deleteVolunteerRecordById(Long var1);

    public int deleteVolunteerRecordByIds(Long[] var1);
}

