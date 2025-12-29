package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.Invitation;

/**
 * 邀请码Service接口
 * 
 * @author ruoyi
 * @date 2025-08-18
 */
public interface IInvitationService 
{
    /**
     * 查询邀请码
     * 
     * @param id 邀请码主键
     * @return 邀请码
     */
    public Invitation selectInvitationById(Long id);

    /**
     * 查询邀请码列表
     * 
     * @param invitation 邀请码
     * @return 邀请码集合
     */
    public List<Invitation> selectInvitationList(Invitation invitation);

    /**
     * 根据条件查询对应的邀请码
     * @param invitation
     * @return
     */
    public Invitation selectInvitation(Invitation invitation);

    /**
     * 新增邀请码
     * 
     * @param invitation 邀请码
     * @return 结果
     */
    public int insertInvitation(Invitation invitation);

    /**
     * 修改邀请码
     * 
     * @param invitation 邀请码
     * @return 结果
     */
    public int updateInvitation(Invitation invitation);

    /**
     * 批量删除邀请码
     * 
     * @param ids 需要删除的邀请码主键集合
     * @return 结果
     */
    public int deleteInvitationByIds(Long[] ids);

    /**
     * 删除邀请码信息
     * 
     * @param id 邀请码主键
     * @return 结果
     */
    public int deleteInvitationById(Long id);
}
