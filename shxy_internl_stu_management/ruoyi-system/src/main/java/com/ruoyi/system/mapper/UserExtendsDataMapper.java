package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.UserExtendsData;

/**
 * 用户数据扩展Mapper接口
 * 
 * @author ruoyi
 * @date 2025-09-29
 */
public interface UserExtendsDataMapper 
{
    /**
     * 查询用户数据扩展
     * 
     * @param userId 用户数据扩展主键
     * @return 用户数据扩展
     */
    public UserExtendsData selectUserExtendsDataByUserId(Long userId);

    /**
     * 查询用户数据扩展列表
     * 
     * @param userExtendsData 用户数据扩展
     * @return 用户数据扩展集合
     */
    public List<UserExtendsData> selectUserExtendsDataList(UserExtendsData userExtendsData);

    /**
     * 新增用户数据扩展
     * 
     * @param userExtendsData 用户数据扩展
     * @return 结果
     */
    public int insertUserExtendsData(UserExtendsData userExtendsData);

    /**
     * 修改用户数据扩展
     * 
     * @param userExtendsData 用户数据扩展
     * @return 结果
     */
    public int updateUserExtendsData(UserExtendsData userExtendsData);

    /**
     * 退回用户积分
     * @param userExtendsData
     * @return
     */
    public int refundUserPoint(UserExtendsData userExtendsData);

    /**
     * 获取用户积分
     * @param userExtendsData
     * @return
     */
    public int addUserPoint(UserExtendsData userExtendsData);

    /**
     * 删除用户数据扩展
     * 
     * @param userId 用户数据扩展主键
     * @return 结果
     */
    public int deleteUserExtendsDataByUserId(Long userId);

    /**
     * 批量删除用户数据扩展
     * 
     * @param userIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteUserExtendsDataByUserIds(Long[] userIds);
}
