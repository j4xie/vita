package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.ActivityModelMapper;
import com.ruoyi.system.domain.ActivityModel;
import com.ruoyi.system.service.IActivityModelService;

/**
 * 活动模板Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-10-24
 */
@Service
public class ActivityModelServiceImpl implements IActivityModelService 
{
    @Autowired
    private ActivityModelMapper activityModelMapper;

    /**
     * 查询活动模板
     * 
     * @param id 活动模板主键
     * @return 活动模板
     */
    @Override
    public ActivityModel selectActivityModelById(Long id)
    {
        return activityModelMapper.selectActivityModelById(id);
    }

    /**
     * 查询活动模板列表
     * 
     * @param activityModel 活动模板
     * @return 活动模板
     */
    @Override
    public List<ActivityModel> selectActivityModelList(ActivityModel activityModel)
    {
        return activityModelMapper.selectActivityModelList(activityModel);
    }

    /**
     * 新增活动模板
     * 
     * @param activityModel 活动模板
     * @return 结果
     */
    @Override
    public int insertActivityModel(ActivityModel activityModel)
    {
        activityModel.setCreateTime(DateUtils.getNowDate());
        return activityModelMapper.insertActivityModel(activityModel);
    }

    /**
     * 修改活动模板
     * 
     * @param activityModel 活动模板
     * @return 结果
     */
    @Override
    public int updateActivityModel(ActivityModel activityModel)
    {
        activityModel.setUpdateTime(DateUtils.getNowDate());
        return activityModelMapper.updateActivityModel(activityModel);
    }

    /**
     * 批量删除活动模板
     * 
     * @param ids 需要删除的活动模板主键
     * @return 结果
     */
    @Override
    public int deleteActivityModelByIds(Long[] ids)
    {
        return activityModelMapper.deleteActivityModelByIds(ids);
    }

    /**
     * 删除活动模板信息
     * 
     * @param id 活动模板主键
     * @return 结果
     */
    @Override
    public int deleteActivityModelById(Long id)
    {
        return activityModelMapper.deleteActivityModelById(id);
    }
}
