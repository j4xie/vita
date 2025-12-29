package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.common.annotation.DataScope;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.ActivityMapper;
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.service.IActivityService;

/**
 * 活动Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-08-13
 */
@Service
public class ActivityServiceImpl implements IActivityService 
{
    @Autowired
    private ActivityMapper activityMapper;

    /**
     * 查询活动
     * 
     * @param id 活动主键
     * @return 活动
     */
    @Override
    public Activity selectActivityById(Long id)
    {
        return activityMapper.selectActivityById(id);
    }

    /**
     * 查询活动列表
     * 
     * @param activity 活动
     * @return 活动
     */
    @Override
    @DataScope(deptAlias = "d", userAlias = "u")
    public List<Activity> selectActivityList(Activity activity)
    {
        return activityMapper.selectActivityList(activity);
    }

    /**
     * App查询活动列表
     *
     * @param activity 活动
     * @return 活动集合
     */
    @Override
    public List<Activity> selectActivityListForApp(Activity activity)
    {
        return activityMapper.selectActivityListForApp(activity);
    }

    /**
     * App查询用户已报名的
     *
     * @param activity 活动
     * @return 活动集合
     */
    public List<Activity> selectActivityListByUser(Activity activity)
    {
        return activityMapper.selectActivityListByUser(activity);
    }

    /**
     * 新增活动
     * 
     * @param activity 活动
     * @return 结果
     */
    @Override
    public int insertActivity(Activity activity)
    {
        activity.setCreateTime(DateUtils.getNowDate());
        return activityMapper.insertActivity(activity);
    }

    /**
     * 修改活动
     * 
     * @param activity 活动
     * @return 结果
     */
    @Override
    public int updateActivity(Activity activity)
    {
        activity.setUpdateTime(DateUtils.getNowDate());
        return activityMapper.updateActivity(activity);
    }

    /**
     * 批量删除活动
     * 
     * @param ids 需要删除的活动主键
     * @return 结果
     */
    @Override
    public int deleteActivityByIds(Long[] ids)
    {
        return activityMapper.deleteActivityByIds(ids);
    }

    /**
     * 删除活动信息
     * 
     * @param id 活动主键
     * @return 结果
     */
    @Override
    public int deleteActivityById(Long id)
    {
        return activityMapper.deleteActivityById(id);
    }
}
