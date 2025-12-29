package com.ruoyi.system.service.impl;

import java.util.List;

import com.ruoyi.system.domain.vo.ActivityExUserVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.ActivityExUserMapper;
import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.service.IActivityExUserService;

/**
 * 【请填写功能名称】Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-08-14
 */
@Service
public class ActivityExUserServiceImpl implements IActivityExUserService 
{
    @Autowired
    private ActivityExUserMapper activityExUserMapper;

    /**
     * 查询【请填写功能名称】
     * 
     * @param activityId 【请填写功能名称】主键
     * @return 【请填写功能名称】
     */
    @Override
    public ActivityExUser selectActivityExUserByActivityId(Long activityId)
    {
        return activityExUserMapper.selectActivityExUserByActivityId(activityId);
    }

    /**
     * 查询【请填写功能名称】列表
     * 
     * @param activityExUser 【请填写功能名称】
     * @return 【请填写功能名称】
     */
    @Override
    public List<ActivityExUser> selectActivityExUserList(ActivityExUser activityExUser)
    {
        return activityExUserMapper.selectActivityExUserList(activityExUser);
    }

    /**
     * 根据活动id，查询报名列表
     * @param activityExUser
     * @return
     */
    @Override
    public List<ActivityExUserVo> selectActivityExUserVoList(ActivityExUser activityExUser) {
        return activityExUserMapper.selectActivityExUserVoList(activityExUser);
    }

    /**
     * 新增【请填写功能名称】
     * 
     * @param activityExUser 【请填写功能名称】
     * @return 结果
     */
    @Override
    public int insertActivityExUser(ActivityExUser activityExUser)
    {
        return activityExUserMapper.insertActivityExUser(activityExUser);
    }

    /**
     * 修改【请填写功能名称】
     * 
     * @param activityExUser 【请填写功能名称】
     * @return 结果
     */
    @Override
    public int updateActivityExUser(ActivityExUser activityExUser)
    {
        return activityExUserMapper.updateActivityExUser(activityExUser);
    }

    /**
     * 批量删除【请填写功能名称】
     * 
     * @param activityIds 需要删除的【请填写功能名称】主键
     * @return 结果
     */
    @Override
    public int deleteActivityExUserByActivityIds(Long[] activityIds)
    {
        return activityExUserMapper.deleteActivityExUserByActivityIds(activityIds);
    }

    /**
     * 删除活动报名
     *
     * @return 结果
     */
    public int deleteActivityRegist(ActivityExUser activityExUser){
        return activityExUserMapper.deleteActivityRegist(activityExUser);
    }

    /**
     * 删除【请填写功能名称】信息
     * 
     * @param activityId 【请填写功能名称】主键
     * @return 结果
     */
    @Override
    public int deleteActivityExUserByActivityId(Long activityId)
    {
        return activityExUserMapper.deleteActivityExUserByActivityId(activityId);
    }
}
