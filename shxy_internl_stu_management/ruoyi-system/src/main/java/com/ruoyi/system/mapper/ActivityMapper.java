package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.Activity;

/**
 * 活动Mapper接口
 * 
 * @author ruoyi
 * @date 2025-08-13
 */
public interface ActivityMapper 
{
    /**
     * 查询活动
     * 
     * @param id 活动主键
     * @return 活动
     */
    public Activity selectActivityById(Long id);

    /**
     * 查询活动列表
     * 
     * @param activity 活动
     * @return 活动集合
     */
    public List<Activity> selectActivityList(Activity activity);

    /**
     * App查询活动列表
     *
     * @param activity 活动
     * @return 活动集合
     */
    public List<Activity> selectActivityListForApp(Activity activity);

    /**
     * App查询用户已报名的
     *
     * @param activity 活动
     * @return 活动集合
     */
    public List<Activity> selectActivityListByUser(Activity activity);

    /**
     * 新增活动
     * 
     * @param activity 活动
     * @return 结果
     */
    public int insertActivity(Activity activity);

    /**
     * 修改活动
     * 
     * @param activity 活动
     * @return 结果
     */
    public int updateActivity(Activity activity);

    /**
     * 删除活动
     * 
     * @param id 活动主键
     * @return 结果
     */
    public int deleteActivityById(Long id);

    /**
     * 批量删除活动
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteActivityByIds(Long[] ids);
}
