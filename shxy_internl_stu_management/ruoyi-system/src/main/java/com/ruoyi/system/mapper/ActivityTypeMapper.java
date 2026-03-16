package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.ActivityType;

/**
 * 活动类型Mapper接口
 * 
 * @author ruoyi
 * @date 2026-03-16
 */
public interface ActivityTypeMapper 
{
    /**
     * 查询活动类型
     * 
     * @param id 活动类型主键
     * @return 活动类型
     */
    public ActivityType selectActivityTypeById(Long id);

    /**
     * 查询活动类型列表
     * 
     * @param activityType 活动类型
     * @return 活动类型集合
     */
    public List<ActivityType> selectActivityTypeList(ActivityType activityType);

    /**
     * 新增活动类型
     * 
     * @param activityType 活动类型
     * @return 结果
     */
    public int insertActivityType(ActivityType activityType);

    /**
     * 修改活动类型
     * 
     * @param activityType 活动类型
     * @return 结果
     */
    public int updateActivityType(ActivityType activityType);

    /**
     * 删除活动类型
     * 
     * @param id 活动类型主键
     * @return 结果
     */
    public int deleteActivityTypeById(Long id);

    /**
     * 批量删除活动类型
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteActivityTypeByIds(Long[] ids);
}
