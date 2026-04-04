/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.Invitation
 *  com.ruoyi.system.service.IInvitationService
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.PutMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.service.IInvitationService;
import java.util.List;
import java.util.Random;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/system/invitation"})
public class InvitationController
extends BaseController {
    @Autowired
    private IInvitationService invitationService;

    @PreAuthorize(value="@ss.hasPermi('system:invitation:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(Invitation invitation) {
        this.startPage();
        List list = this.invitationService.selectInvitationList(invitation);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:invitation:export')")
    @Log(title="\u9080\u8bf7\u7801", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, Invitation invitation) {
        List list = this.invitationService.selectInvitationList(invitation);
        ExcelUtil util = new ExcelUtil(Invitation.class);
        util.exportExcel(response, list, "\u9080\u8bf7\u7801\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:invitation:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.invitationService.selectInvitationById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:invitation:add')")
    @Log(title="\u9080\u8bf7\u7801", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Invitation invitation) {
        return this.toAjax(this.invitationService.insertInvitation(invitation));
    }

    @PreAuthorize(value="@ss.hasPermi('system:invitation:edit')")
    @Log(title="\u9080\u8bf7\u7801", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Invitation invitation) {
        return this.toAjax(this.invitationService.updateInvitation(invitation));
    }

    @PreAuthorize(value="@ss.hasPermi('system:invitation:remove')")
    @Log(title="\u9080\u8bf7\u7801", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.invitationService.deleteInvitationByIds(ids));
    }

    @PreAuthorize(value="@ss.hasPermi('system:invitation:edit')")
    @Log(title="\u9080\u8bf7\u7801", businessType=BusinessType.UPDATE)
    @PutMapping(value={"/resetInv"})
    public AjaxResult resetInv(@RequestBody Invitation invitation) {
        invitation.setInvCode(this.genRandomNum() + invitation.getUserId().toString());
        return this.toAjax(this.invitationService.updateInvitation(invitation));
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
