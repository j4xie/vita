/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.system.domain.Invitation
 *  com.ruoyi.system.service.IInvitationService
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.service.IInvitationService;
import java.util.List;
import java.util.Random;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/invitation"})
public class AppInvitationController
extends BaseController {
    @Autowired
    private IInvitationService invitationService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(Invitation invitation) {
        this.startPage();
        List list = this.invitationService.selectInvitationList(invitation);
        return this.getDataTable(list);
    }

    @PostMapping(value={"/invInfo"})
    public AjaxResult getInfo(Invitation invitation) {
        if (null != invitation && null != invitation.getUserId()) {
            Invitation invitationDTO = this.invitationService.selectInvitation(invitation);
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("data", (Object)invitationDTO);
            return ajaxResult;
        }
        AjaxResult ajaxResult = AjaxResult.error();
        return ajaxResult;
    }

    @PostMapping(value={"/addInv"})
    public AjaxResult add(Invitation invitation) {
        Invitation invitationDTO = this.invitationService.selectInvitation(invitation);
        if (null != invitationDTO) {
            invitation.setInvCode(this.genRandomNum() + invitation.getUserId().toString());
            invitation.setId(invitationDTO.getId());
            return this.toAjax(this.invitationService.updateInvitation(invitation));
        }
        invitation.setInvCode(this.genRandomNum() + invitation.getUserId().toString());
        return this.toAjax(this.invitationService.insertInvitation(invitation));
    }

    @PostMapping(value={"/resetInv"})
    public AjaxResult edit(Invitation invitation) {
        invitation.setInvCode(this.genRandomNum() + invitation.getUserId().toString());
        return this.toAjax(this.invitationService.updateInvitation(invitation));
    }

    @GetMapping(value={"/checkInviteCode"})
    public AjaxResult checkInviteCode(String inviteCode) {
        if (!TextUtils.isEmpty((CharSequence)inviteCode)) {
            Invitation invitation = new Invitation();
            invitation.setInvCode(inviteCode);
            List list = this.invitationService.selectInvitationList(invitation);
            if (list.size() <= 0) {
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u9080\u8bf7\u7801\u5931\u6548");
                ajaxResult.put("data", (Object)"0");
                return ajaxResult;
            }
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("msg", (Object)"\u9080\u8bf7\u7801\u6709\u6548");
            ajaxResult.put("data", (Object)"1");
            return ajaxResult;
        }
        AjaxResult ajaxResult = AjaxResult.error();
        ajaxResult.put("msg", (Object)"\u8bf7\u8f93\u5165\u9080\u8bf7\u7801");
        ajaxResult.put("data", (Object)"0");
        return ajaxResult;
    }

    public String genRandomNum() {
        int maxNum = 36;
        int count = 0;
        char[] str = new char[]{'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'};
        StringBuffer pwd = new StringBuffer("");
        Random r = new Random();
        while (count < 8) {
            int i = Math.abs(r.nextInt(maxNum));
            if (i < 0 || i >= str.length) continue;
            pwd.append(str[i]);
            ++count;
        }
        return pwd.toString();
    }
}
