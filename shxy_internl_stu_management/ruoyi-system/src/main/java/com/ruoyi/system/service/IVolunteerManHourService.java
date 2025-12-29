package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.VolunteerManHour;

/**
 * 志愿者总工时Service接口
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
public interface IVolunteerManHourService 
{
    /**
     * 查询志愿者总工时
     * 
     * @param userId 志愿者总工时主键
     * @return 志愿者总工时
     */
    public VolunteerManHour selectVolunteerManHourByUserId(Long userId);

    /**
     * 查询志愿者总工时列表
     * 
     * @param volunteerManHour 志愿者总工时
     * @return 志愿者总工时集合
     */
    public List<VolunteerManHour> selectVolunteerManHourList(VolunteerManHour volunteerManHour);

    /**
     * 查询志愿者总工时列表 app用
     *
     * @param volunteerManHour 志愿者总工时
     * @return 志愿者总工时集合
     */
    public List<VolunteerManHour> selectVolunteerManHourListForApp(VolunteerManHour volunteerManHour);

    /**
     * 新增志愿者总工时
     * 
     * @param volunteerManHour 志愿者总工时
     * @return 结果
     */
    public int insertVolunteerManHour(VolunteerManHour volunteerManHour);

    /**
     * 修改志愿者总工时
     * 
     * @param volunteerManHour 志愿者总工时
     * @return 结果
     */
    public int updateVolunteerManHour(VolunteerManHour volunteerManHour);

    /**
     * 批量删除志愿者总工时
     * 
     * @param userIds 需要删除的志愿者总工时主键集合
     * @return 结果
     */
    public int deleteVolunteerManHourByUserIds(Long[] userIds);

    /**
     * 删除志愿者总工时信息
     * 
     * @param userId 志愿者总工时主键
     * @return 结果
     */
    public int deleteVolunteerManHourByUserId(Long userId);
}
