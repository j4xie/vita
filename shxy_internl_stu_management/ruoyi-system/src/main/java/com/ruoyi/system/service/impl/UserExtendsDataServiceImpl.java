package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.UserExtendsDataMapper;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.service.IUserExtendsDataService;

/**
 * 用户数据扩展Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-29
 */
@Service
public class UserExtendsDataServiceImpl implements IUserExtendsDataService 
{
    @Autowired
    private UserExtendsDataMapper userExtendsDataMapper;

    /**
     * 查询用户数据扩展
     * 
     * @param userId 用户数据扩展主键
     * @return 用户数据扩展
     */
    @Override
    public UserExtendsData selectUserExtendsDataByUserId(Long userId)
    {
        return userExtendsDataMapper.selectUserExtendsDataByUserId(userId);
    }

    /**
     * 查询用户数据扩展列表
     * 
     * @param userExtendsData 用户数据扩展
     * @return 用户数据扩展
     */
    @Override
    public List<UserExtendsData> selectUserExtendsDataList(UserExtendsData userExtendsData)
    {
        return userExtendsDataMapper.selectUserExtendsDataList(userExtendsData);
    }

    /**
     * 新增用户数据扩展
     * 
     * @param userExtendsData 用户数据扩展
     * @return 结果
     */
    @Override
    public int insertUserExtendsData(UserExtendsData userExtendsData)
    {
        return userExtendsDataMapper.insertUserExtendsData(userExtendsData);
    }

    /**
     * 修改用户数据扩展
     * 
     * @param userExtendsData 用户数据扩展
     * @return 结果
     */
    @Override
    public int updateUserExtendsData(UserExtendsData userExtendsData)
    {
        return userExtendsDataMapper.updateUserExtendsData(userExtendsData);
    }

    /**
     * 退回用户积分
     * @param userExtendsData
     * @return
     */
    @Override
    public int refundUserPoint(UserExtendsData userExtendsData){
        return userExtendsDataMapper.refundUserPoint(userExtendsData);
    }

    /**
     * 获取用户积分
     * @param userExtendsData
     * @return
     */
    @Override
    public int addUserPoint(UserExtendsData userExtendsData){
        UserExtendsData userExtendsDataDTO = userExtendsDataMapper.selectUserExtendsDataByUserId(userExtendsData.getUserId());
        if(null != userExtendsDataDTO){
            return userExtendsDataMapper.addUserPoint(userExtendsData);
        }else{
            return userExtendsDataMapper.insertUserExtendsData(userExtendsData);
        }
    }

    /**
     * 批量删除用户数据扩展
     * 
     * @param userIds 需要删除的用户数据扩展主键
     * @return 结果
     */
    @Override
    public int deleteUserExtendsDataByUserIds(Long[] userIds)
    {
        return userExtendsDataMapper.deleteUserExtendsDataByUserIds(userIds);
    }

    /**
     * 删除用户数据扩展信息
     * 
     * @param userId 用户数据扩展主键
     * @return 结果
     */
    @Override
    public int deleteUserExtendsDataByUserId(Long userId)
    {
        return userExtendsDataMapper.deleteUserExtendsDataByUserId(userId);
    }
}
