package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.InvitationMapper;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.service.IInvitationService;

/**
 * 邀请码Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-08-18
 */
@Service
public class InvitationServiceImpl implements IInvitationService 
{
    @Autowired
    private InvitationMapper invitationMapper;

    /**
     * 查询邀请码
     * 
     * @param id 邀请码主键
     * @return 邀请码
     */
    @Override
    public Invitation selectInvitationById(Long id)
    {
        return invitationMapper.selectInvitationById(id);
    }

    /**
     * 查询邀请码列表
     * 
     * @param invitation 邀请码
     * @return 邀请码
     */
    @Override
    public List<Invitation> selectInvitationList(Invitation invitation)
    {
        return invitationMapper.selectInvitationList(invitation);
    }

    /**
     * 根据条件查询对应的邀请码
     * @param invitation
     * @return
     */
    public Invitation selectInvitation(Invitation invitation)
    {
        return invitationMapper.selectInvitation(invitation);
    }

    /**
     * 新增邀请码
     * 
     * @param invitation 邀请码
     * @return 结果
     */
    @Override
    public int insertInvitation(Invitation invitation)
    {
        return invitationMapper.insertInvitation(invitation);
    }

    /**
     * 修改邀请码
     * 
     * @param invitation 邀请码
     * @return 结果
     */
    @Override
    public int updateInvitation(Invitation invitation)
    {
        return invitationMapper.updateInvitation(invitation);
    }

    /**
     * 批量删除邀请码
     * 
     * @param ids 需要删除的邀请码主键
     * @return 结果
     */
    @Override
    public int deleteInvitationByIds(Long[] ids)
    {
        return invitationMapper.deleteInvitationByIds(ids);
    }

    /**
     * 删除邀请码信息
     * 
     * @param id 邀请码主键
     * @return 结果
     */
    @Override
    public int deleteInvitationById(Long id)
    {
        return invitationMapper.deleteInvitationById(id);
    }
}
