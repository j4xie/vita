package com.ruoyi.system.service.impl;

import java.util.List;
import com.ruoyi.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.UserLevelExEquityMapper;
import com.ruoyi.system.domain.UserLevelExEquity;
import com.ruoyi.system.service.IUserLevelExEquityService;

/**
 * 会员等级关联权益Service业务层处理
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
@Service
public class UserLevelExEquityServiceImpl implements IUserLevelExEquityService 
{
    @Autowired
    private UserLevelExEquityMapper userLevelExEquityMapper;

    /**
     * 查询会员等级关联权益
     * 
     * @param levelId 会员等级关联权益主键
     * @return 会员等级关联权益
     */
    @Override
    public UserLevelExEquity selectUserLevelExEquityByLevelId(Long levelId)
    {
        return userLevelExEquityMapper.selectUserLevelExEquityByLevelId(levelId);
    }

    /**
     * 查询会员等级关联权益列表
     * 
     * @param userLevelExEquity 会员等级关联权益
     * @return 会员等级关联权益
     */
    @Override
    public List<UserLevelExEquity> selectUserLevelExEquityList(UserLevelExEquity userLevelExEquity)
    {
        return userLevelExEquityMapper.selectUserLevelExEquityList(userLevelExEquity);
    }

    /**
     * 新增会员等级关联权益
     * 
     * @param userLevelExEquity 会员等级关联权益
     * @return 结果
     */
    @Override
    public int insertUserLevelExEquity(UserLevelExEquity userLevelExEquity)
    {
        userLevelExEquity.setCreateTime(DateUtils.getNowDate());
        return userLevelExEquityMapper.insertUserLevelExEquity(userLevelExEquity);
    }

    /**
     * 修改会员等级关联权益
     * 
     * @param userLevelExEquity 会员等级关联权益
     * @return 结果
     */
    @Override
    public int updateUserLevelExEquity(UserLevelExEquity userLevelExEquity)
    {
        return userLevelExEquityMapper.updateUserLevelExEquity(userLevelExEquity);
    }

    /**
     * 批量删除会员等级关联权益
     * 
     * @param levelIds 需要删除的会员等级关联权益主键
     * @return 结果
     */
    @Override
    public int deleteUserLevelExEquityByLevelIds(Long[] levelIds)
    {
        return userLevelExEquityMapper.deleteUserLevelExEquityByLevelIds(levelIds);
    }

    /**
     * 删除会员等级关联权益信息
     * 
     * @param levelId 会员等级关联权益主键
     * @return 结果
     */
    @Override
    public int deleteUserLevelExEquityByLevelId(Long levelId)
    {
        return userLevelExEquityMapper.deleteUserLevelExEquityByLevelId(levelId);
    }
}
