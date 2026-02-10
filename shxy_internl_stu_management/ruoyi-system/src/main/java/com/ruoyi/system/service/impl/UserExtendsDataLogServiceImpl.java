package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.UserExtendsDataLogMapper;
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.system.service.IUserExtendsDataLogService;

/**
 * 用户数据积分等记录Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-02-04
 */
@Service
public class UserExtendsDataLogServiceImpl implements IUserExtendsDataLogService 
{
    @Autowired
    private UserExtendsDataLogMapper userExtendsDataLogMapper;

    /**
     * 查询用户数据积分等记录
     * 
     * @param userId 用户数据积分等记录主键
     * @return 用户数据积分等记录
     */
    @Override
    public List<UserExtendsDataLog> selectUserExtendsDataLogByUserId(Long userId)
    {
        return userExtendsDataLogMapper.selectUserExtendsDataLogByUserId(userId);
    }

    /**
     * 查询用户数据积分等记录列表
     * 
     * @param userExtendsDataLog 用户数据积分等记录
     * @return 用户数据积分等记录
     */
    @Override
    public List<UserExtendsDataLog> selectUserExtendsDataLogList(UserExtendsDataLog userExtendsDataLog)
    {
        return userExtendsDataLogMapper.selectUserExtendsDataLogList(userExtendsDataLog);
    }

    /**
     * 新增用户数据积分等记录
     * 
     * @param userExtendsDataLog 用户数据积分等记录
     * @return 结果
     */
    @Override
    public int insertUserExtendsDataLog(UserExtendsDataLog userExtendsDataLog)
    {
        userExtendsDataLog.setCreateTime(DateUtils.getNowDate());
        return userExtendsDataLogMapper.insertUserExtendsDataLog(userExtendsDataLog);
    }

    /**
     * 修改用户数据积分等记录
     * 
     * @param userExtendsDataLog 用户数据积分等记录
     * @return 结果
     */
    @Override
    public int updateUserExtendsDataLog(UserExtendsDataLog userExtendsDataLog)
    {
        return userExtendsDataLogMapper.updateUserExtendsDataLog(userExtendsDataLog);
    }

    /**
     * 批量删除用户数据积分等记录
     * 
     * @param userIds 需要删除的用户数据积分等记录主键
     * @return 结果
     */
    @Override
    public int deleteUserExtendsDataLogByUserIds(Long[] userIds)
    {
        return userExtendsDataLogMapper.deleteUserExtendsDataLogByUserIds(userIds);
    }

    /**
     * 删除用户数据积分等记录信息
     * 
     * @param userId 用户数据积分等记录主键
     * @return 结果
     */
    @Override
    public int deleteUserExtendsDataLogByUserId(Long userId)
    {
        return userExtendsDataLogMapper.deleteUserExtendsDataLogByUserId(userId);
    }
}
