package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;

/**
 * 用户数据积分等记录Mapper接口
 * 
 * @author ruoyi
 * @date 2026-02-04
 */
public interface UserExtendsDataLogMapper 
{
    /**
     * 查询用户数据积分等记录
     * 
     * @param userId 用户数据积分等记录主键
     * @return 用户数据积分等记录
     */
    public List<UserExtendsDataLog> selectUserExtendsDataLogByUserId(Long userId);

    /**
     * 查询用户数据积分等记录列表
     * 
     * @param userExtendsDataLog 用户数据积分等记录
     * @return 用户数据积分等记录集合
     */
    public List<UserExtendsDataLog> selectUserExtendsDataLogList(UserExtendsDataLog userExtendsDataLog);

    /**
     * 新增用户数据积分等记录
     * 
     * @param userExtendsDataLog 用户数据积分等记录
     * @return 结果
     */
    public int insertUserExtendsDataLog(UserExtendsDataLog userExtendsDataLog);

    /**
     * 修改用户数据积分等记录
     * 
     * @param userExtendsDataLog 用户数据积分等记录
     * @return 结果
     */
    public int updateUserExtendsDataLog(UserExtendsDataLog userExtendsDataLog);

    /**
     * 删除用户数据积分等记录
     * 
     * @param userId 用户数据积分等记录主键
     * @return 结果
     */
    public int deleteUserExtendsDataLogByUserId(Long userId);

    /**
     * 批量删除用户数据积分等记录
     * 
     * @param userIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteUserExtendsDataLogByUserIds(Long[] userIds);
}
