/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.Invitation;
import java.util.List;

public interface InvitationMapper {
    public Invitation selectInvitationById(Long var1);

    public List<Invitation> selectInvitationList(Invitation var1);

    public Invitation selectInvitation(Invitation var1);

    public int insertInvitation(Invitation var1);

    public int updateInvitation(Invitation var1);

    public int deleteInvitationById(Long var1);

    public int deleteInvitationByIds(Long[] var1);
}

