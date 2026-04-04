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
 *  com.ruoyi.system.domain.UserExMerchantAuditLog
 *  com.ruoyi.system.service.IUserExMerchantAuditLogService
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
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.service.IUserExMerchantAuditLogService;
import java.util.List;
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
@RequestMapping(value={"/system/log"})
public class UserExMerchantAuditLogController
extends BaseController {
    @Autowired
    private IUserExMerchantAuditLogService userExMerchantAuditLogService;

    @PreAuthorize(value="@ss.hasPermi('system:log:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(UserExMerchantAuditLog userExMerchantAuditLog) {
        this.startPage();
        List list = this.userExMerchantAuditLogService.selectUserExMerchantAuditLogList(userExMerchantAuditLog);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:export')")
    @Log(title="\u5546\u6237\u5ba1\u6838\u65e5\u5fd7", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, UserExMerchantAuditLog userExMerchantAuditLog) {
        List list = this.userExMerchantAuditLogService.selectUserExMerchantAuditLogList(userExMerchantAuditLog);
        ExcelUtil util = new ExcelUtil(UserExMerchantAuditLog.class);
        util.exportExcel(response, list, "\u5546\u6237\u5ba1\u6838\u65e5\u5fd7\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.userExMerchantAuditLogService.selectUserExMerchantAuditLogById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:add')")
    @Log(title="\u5546\u6237\u5ba1\u6838\u65e5\u5fd7", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserExMerchantAuditLog userExMerchantAuditLog) {
        return this.toAjax(this.userExMerchantAuditLogService.insertUserExMerchantAuditLog(userExMerchantAuditLog));
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:edit')")
    @Log(title="\u5546\u6237\u5ba1\u6838\u65e5\u5fd7", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserExMerchantAuditLog userExMerchantAuditLog) {
        return this.toAjax(this.userExMerchantAuditLogService.updateUserExMerchantAuditLog(userExMerchantAuditLog));
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:remove')")
    @Log(title="\u5546\u6237\u5ba1\u6838\u65e5\u5fd7", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.userExMerchantAuditLogService.deleteUserExMerchantAuditLogByIds(ids));
    }
}
