package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.ActivityModel;

/**
 * 活动模板Service接口
 * 
 * @author ruoyi
 * @date 2025-10-24
 */
public interface IActivityModelService 
{
    /**
     * 查询活动模板
     * 
     * @param id 活动模板主键
     * @return 活动模板
     */
    public ActivityModel selectActivityModelById(Long id);

    /**
     * 查询活动模板列表
     * 
     * @param activityModel 活动模板
     * @return 活动模板集合
     */
    public List<ActivityModel> selectActivityModelList(ActivityModel activityModel);

    /**
     * 新增活动模板
     * 
     * @param activityModel 活动模板
     * @return 结果
     */
    public int insertActivityModel(ActivityModel activityModel);

    /**
     * 修改活动模板
     * 
     * @param activityModel 活动模板
     * @return 结果
     */
    public int updateActivityModel(ActivityModel activityModel);

    /**
     * 批量删除活动模板
     * 
     * @param ids 需要删除的活动模板主键集合
     * @return 结果
     */
    public int deleteActivityModelByIds(Long[] ids);

    /**
     * 删除活动模板信息
     * 
     * @param id 活动模板主键
     * @return 结果
     */
    public int deleteActivityModelById(Long id);
}
