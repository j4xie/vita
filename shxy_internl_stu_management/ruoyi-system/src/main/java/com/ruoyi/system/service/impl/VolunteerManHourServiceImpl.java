package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.common.annotation.DataScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.VolunteerManHourMapper;
import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.service.IVolunteerManHourService;

/**
 * 志愿者总工时Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
@Service
public class VolunteerManHourServiceImpl implements IVolunteerManHourService 
{
    @Autowired
    private VolunteerManHourMapper volunteerManHourMapper;

    /**
     * 查询志愿者总工时
     * 
     * @param userId 志愿者总工时主键
     * @return 志愿者总工时
     */
    @Override
    public VolunteerManHour selectVolunteerManHourByUserId(Long userId)
    {
        return volunteerManHourMapper.selectVolunteerManHourByUserId(userId);
    }

    /**
     * 查询志愿者总工时列表
     * 
     * @param volunteerManHour 志愿者总工时
     * @return 志愿者总工时
     */
    @Override
    @DataScope(deptAlias = "d", userAlias = "u")
    public List<VolunteerManHour> selectVolunteerManHourList(VolunteerManHour volunteerManHour)
    {
        return volunteerManHourMapper.selectVolunteerManHourList(volunteerManHour);
    }

    /**
     * 查询志愿者总工时列表 app用
     *
     * @param volunteerManHour 志愿者总工时
     * @return 志愿者总工时集合
     */
    public List<VolunteerManHour> selectVolunteerManHourListForApp(VolunteerManHour volunteerManHour){
        return volunteerManHourMapper.selectVolunteerManHourListForApp(volunteerManHour);
    }

    /**
     * 新增志愿者总工时
     * 
     * @param volunteerManHour 志愿者总工时
     * @return 结果
     */
    @Override
    public int insertVolunteerManHour(VolunteerManHour volunteerManHour)
    {
        return volunteerManHourMapper.insertVolunteerManHour(volunteerManHour);
    }

    /**
     * 修改志愿者总工时
     * 
     * @param volunteerManHour 志愿者总工时
     * @return 结果
     */
    @Override
    public int updateVolunteerManHour(VolunteerManHour volunteerManHour)
    {
        return volunteerManHourMapper.updateVolunteerManHour(volunteerManHour);
    }

    /**
     * 批量删除志愿者总工时
     * 
     * @param userIds 需要删除的志愿者总工时主键
     * @return 结果
     */
    @Override
    public int deleteVolunteerManHourByUserIds(Long[] userIds)
    {
        return volunteerManHourMapper.deleteVolunteerManHourByUserIds(userIds);
    }

    /**
     * 删除志愿者总工时信息
     * 
     * @param userId 志愿者总工时主键
     * @return 结果
     */
    @Override
    public int deleteVolunteerManHourByUserId(Long userId)
    {
        return volunteerManHourMapper.deleteVolunteerManHourByUserId(userId);
    }
}
