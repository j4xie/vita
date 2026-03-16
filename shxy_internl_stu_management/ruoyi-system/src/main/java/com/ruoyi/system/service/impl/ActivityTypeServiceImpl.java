package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.ActivityTypeMapper;
import com.ruoyi.system.domain.ActivityType;
import com.ruoyi.system.service.IActivityTypeService;

/**
 * 活动类型Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-03-16
 */
@Service
public class ActivityTypeServiceImpl implements IActivityTypeService 
{
    @Autowired
    private ActivityTypeMapper activityTypeMapper;

    /**
     * 查询活动类型
     * 
     * @param id 活动类型主键
     * @return 活动类型
     */
    @Override
    public ActivityType selectActivityTypeById(Long id)
    {
        return activityTypeMapper.selectActivityTypeById(id);
    }

    /**
     * 查询活动类型列表
     * 
     * @param activityType 活动类型
     * @return 活动类型
     */
    @Override
    public List<ActivityType> selectActivityTypeList(ActivityType activityType)
    {
        return activityTypeMapper.selectActivityTypeList(activityType);
    }

    /**
     * 新增活动类型
     * 
     * @param activityType 活动类型
     * @return 结果
     */
    @Override
    public int insertActivityType(ActivityType activityType)
    {
        activityType.setCreateTime(DateUtils.getNowDate());
        return activityTypeMapper.insertActivityType(activityType);
    }

    /**
     * 修改活动类型
     * 
     * @param activityType 活动类型
     * @return 结果
     */
    @Override
    public int updateActivityType(ActivityType activityType)
    {
        return activityTypeMapper.updateActivityType(activityType);
    }

    /**
     * 批量删除活动类型
     * 
     * @param ids 需要删除的活动类型主键
     * @return 结果
     */
    @Override
    public int deleteActivityTypeByIds(Long[] ids)
    {
        return activityTypeMapper.deleteActivityTypeByIds(ids);
    }

    /**
     * 删除活动类型信息
     * 
     * @param id 活动类型主键
     * @return 结果
     */
    @Override
    public int deleteActivityTypeById(Long id)
    {
        return activityTypeMapper.deleteActivityTypeById(id);
    }
}
