package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.common.annotation.DataScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.VolunteerRecordMapper;
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.service.IVolunteerRecordService;

/**
 * 志愿者打卡记录Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
@Service
public class VolunteerRecordServiceImpl implements IVolunteerRecordService 
{
    @Autowired
    private VolunteerRecordMapper volunteerRecordMapper;

    /**
     * 查询志愿者打卡记录
     * 
     * @param id 志愿者打卡记录主键
     * @return 志愿者打卡记录
     */
    @Override
    public VolunteerRecord selectVolunteerRecordById(Long id)
    {
        return volunteerRecordMapper.selectVolunteerRecordById(id);
    }

    /**
     * 查询志愿者打卡记录列表
     * 
     * @param volunteerRecord 志愿者打卡记录
     * @return 志愿者打卡记录
     */
    @Override
    @DataScope(deptAlias = "d", userAlias = "u")
    public List<VolunteerRecord> selectVolunteerRecordList(VolunteerRecord volunteerRecord)
    {
        return volunteerRecordMapper.selectVolunteerRecordList(volunteerRecord);
    }

    /**
     * 查询志愿者打卡记录列表-app
     *
     * @param volunteerRecord 志愿者打卡记录
     * @return 志愿者打卡记录集合
     */
    @Override
    public List<VolunteerRecord> selectVolunteerRecordListFroApp(VolunteerRecord volunteerRecord){
        return volunteerRecordMapper.selectVolunteerRecordListFroApp(volunteerRecord);
    }

    /**
     * 根据条件查询最新一条记录
     * @param volunteerRecord
     * @return
     */
    public VolunteerRecord selectVolunteerLastRecordFroApp(VolunteerRecord volunteerRecord){
        return volunteerRecordMapper.selectVolunteerLastRecordFroApp(volunteerRecord);
    }

    /**
     * 新增志愿者打卡记录
     * 
     * @param volunteerRecord 志愿者打卡记录
     * @return 结果
     */
    @Override
    public int insertVolunteerRecord(VolunteerRecord volunteerRecord)
    {
        return volunteerRecordMapper.insertVolunteerRecord(volunteerRecord);
    }

    /**
     * 修改志愿者打卡记录
     * 
     * @param volunteerRecord 志愿者打卡记录
     * @return 结果
     */
    @Override
    public int updateVolunteerRecord(VolunteerRecord volunteerRecord)
    {
        return volunteerRecordMapper.updateVolunteerRecord(volunteerRecord);
    }

    /**
     * 批量删除志愿者打卡记录
     * 
     * @param ids 需要删除的志愿者打卡记录主键
     * @return 结果
     */
    @Override
    public int deleteVolunteerRecordByIds(Long[] ids)
    {
        return volunteerRecordMapper.deleteVolunteerRecordByIds(ids);
    }

    /**
     * 删除志愿者打卡记录信息
     * 
     * @param id 志愿者打卡记录主键
     * @return 结果
     */
    @Override
    public int deleteVolunteerRecordById(Long id)
    {
        return volunteerRecordMapper.deleteVolunteerRecordById(id);
    }
}
