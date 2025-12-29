package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.vo.ActivityExUserVo;

/**
 * 【请填写功能名称】Mapper接口
 * 
 * @author ruoyi
 * @date 2025-08-14
 */
public interface ActivityExUserMapper 
{
    /**
     * 查询【请填写功能名称】
     * 
     * @param activityId 【请填写功能名称】主键
     * @return 【请填写功能名称】
     */
    public ActivityExUser selectActivityExUserByActivityId(Long activityId);

    /**
     * 查询【请填写功能名称】列表
     * 
     * @param activityExUser 【请填写功能名称】
     * @return 【请填写功能名称】集合
     */
    public List<ActivityExUser> selectActivityExUserList(ActivityExUser activityExUser);

    /**
     * 根据活动id，查询报名列表
     * @param activityExUser
     * @return
     */
    public List<ActivityExUserVo> selectActivityExUserVoList(ActivityExUser activityExUser);

    /**
     * 新增【请填写功能名称】
     * 
     * @param activityExUser 【请填写功能名称】
     * @return 结果
     */
    public int insertActivityExUser(ActivityExUser activityExUser);

    /**
     * 修改【请填写功能名称】
     * 
     * @param activityExUser 【请填写功能名称】
     * @return 结果
     */
    public int updateActivityExUser(ActivityExUser activityExUser);

    /**
     * 删除【请填写功能名称】
     * 
     * @param activityId 【请填写功能名称】主键
     * @return 结果
     */
    public int deleteActivityExUserByActivityId(Long activityId);

    /**
     * 删除活动报名
     *
     * @return 结果
     */
    public int deleteActivityRegist(ActivityExUser activityExUser);

    /**
     * 批量删除【请填写功能名称】
     * 
     * @param activityIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteActivityExUserByActivityIds(Long[] activityIds);
}
