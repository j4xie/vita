package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.UserLevelExEquity;

/**
 * 会员等级关联权益Service接口
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
public interface IUserLevelExEquityService 
{
    /**
     * 查询会员等级关联权益
     * 
     * @param levelId 会员等级关联权益主键
     * @return 会员等级关联权益
     */
    public UserLevelExEquity selectUserLevelExEquityByLevelId(Long levelId);

    /**
     * 查询会员等级关联权益列表
     * 
     * @param userLevelExEquity 会员等级关联权益
     * @return 会员等级关联权益集合
     */
    public List<UserLevelExEquity> selectUserLevelExEquityList(UserLevelExEquity userLevelExEquity);

    /**
     * 新增会员等级关联权益
     * 
     * @param userLevelExEquity 会员等级关联权益
     * @return 结果
     */
    public int insertUserLevelExEquity(UserLevelExEquity userLevelExEquity);

    /**
     * 修改会员等级关联权益
     * 
     * @param userLevelExEquity 会员等级关联权益
     * @return 结果
     */
    public int updateUserLevelExEquity(UserLevelExEquity userLevelExEquity);

    /**
     * 批量删除会员等级关联权益
     * 
     * @param levelIds 需要删除的会员等级关联权益主键集合
     * @return 结果
     */
    public int deleteUserLevelExEquityByLevelIds(Long[] levelIds);

    /**
     * 删除会员等级关联权益信息
     * 
     * @param levelId 会员等级关联权益主键
     * @return 结果
     */
    public int deleteUserLevelExEquityByLevelId(Long levelId);
}
