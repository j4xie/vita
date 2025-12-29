package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.VolunteerRecord;

/**
 * 志愿者打卡记录Service接口
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
public interface IVolunteerRecordService 
{
    /**
     * 查询志愿者打卡记录
     * 
     * @param id 志愿者打卡记录主键
     * @return 志愿者打卡记录
     */
    public VolunteerRecord selectVolunteerRecordById(Long id);

    /**
     * 查询志愿者打卡记录列表
     * 
     * @param volunteerRecord 志愿者打卡记录
     * @return 志愿者打卡记录集合
     */
    public List<VolunteerRecord> selectVolunteerRecordList(VolunteerRecord volunteerRecord);

    /**
     * 查询志愿者打卡记录列表-app
     *
     * @param volunteerRecord 志愿者打卡记录
     * @return 志愿者打卡记录集合
     */
    public List<VolunteerRecord> selectVolunteerRecordListFroApp(VolunteerRecord volunteerRecord);

    /**
     * 根据条件查询最新一条记录
     * @param volunteerRecord
     * @return
     */
    public VolunteerRecord selectVolunteerLastRecordFroApp(VolunteerRecord volunteerRecord);

    /**
     * 新增志愿者打卡记录
     * 
     * @param volunteerRecord 志愿者打卡记录
     * @return 结果
     */
    public int insertVolunteerRecord(VolunteerRecord volunteerRecord);

    /**
     * 修改志愿者打卡记录
     * 
     * @param volunteerRecord 志愿者打卡记录
     * @return 结果
     */
    public int updateVolunteerRecord(VolunteerRecord volunteerRecord);

    /**
     * 批量删除志愿者打卡记录
     * 
     * @param ids 需要删除的志愿者打卡记录主键集合
     * @return 结果
     */
    public int deleteVolunteerRecordByIds(Long[] ids);

    /**
     * 删除志愿者打卡记录信息
     * 
     * @param id 志愿者打卡记录主键
     * @return 结果
     */
    public int deleteVolunteerRecordById(Long id);
}
