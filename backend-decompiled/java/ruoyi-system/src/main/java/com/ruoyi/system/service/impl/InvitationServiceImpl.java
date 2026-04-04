/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.mapper.InvitationMapper;
import com.ruoyi.system.service.IInvitationService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InvitationServiceImpl
implements IInvitationService {
    @Autowired
    private InvitationMapper invitationMapper;

    @Override
    public Invitation selectInvitationById(Long id) {
        return this.invitationMapper.selectInvitationById(id);
    }

    @Override
    public List<Invitation> selectInvitationList(Invitation invitation) {
        return this.invitationMapper.selectInvitationList(invitation);
    }

    @Override
    public Invitation selectInvitation(Invitation invitation) {
        return this.invitationMapper.selectInvitation(invitation);
    }

    @Override
    public int insertInvitation(Invitation invitation) {
        return this.invitationMapper.insertInvitation(invitation);
    }

    @Override
    public int updateInvitation(Invitation invitation) {
        return this.invitationMapper.updateInvitation(invitation);
    }

    @Override
    public int deleteInvitationByIds(Long[] ids) {
        return this.invitationMapper.deleteInvitationByIds(ids);
    }

    @Override
    public int deleteInvitationById(Long id) {
        return this.invitationMapper.deleteInvitationById(id);
    }
}

