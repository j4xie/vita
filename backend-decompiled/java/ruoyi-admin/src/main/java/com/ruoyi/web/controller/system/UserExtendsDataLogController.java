/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.UserExtendsDataLog
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.service.IUserExtendsDataLogService
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
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.service.IUserExtendsDataLogService;
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
@RequestMapping(value={"/system/userDataLog"})
public class UserExtendsDataLogController
extends BaseController {
    @Autowired
    private IUserExtendsDataLogService userExtendsDataLogService;

    @PreAuthorize(value="@ss.hasPermi('system:log:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(UserExtendsDataLog userExtendsDataLog) {
        this.startPage();
        List list = this.userExtendsDataLogService.selectUserExtendsDataLogList(userExtendsDataLog);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:export')")
    @Log(title="\u7528\u6237\u6570\u636e\u79ef\u5206\u7b49\u8bb0\u5f55", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, UserExtendsDataLog userExtendsDataLog) {
        List list = this.userExtendsDataLogService.selectUserExtendsDataLogList(userExtendsDataLog);
        ExcelUtil util = new ExcelUtil(UserExtendsDataLog.class);
        util.exportExcel(response, list, "\u7528\u6237\u6570\u636e\u79ef\u5206\u7b49\u8bb0\u5f55\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:query')")
    @GetMapping(value={"/{userId}"})
    public AjaxResult getInfo(@PathVariable(value="userId") Long userId) {
        return this.success(this.userExtendsDataLogService.selectUserExtendsDataLogByUserId(userId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:add')")
    @Log(title="\u7528\u6237\u6570\u636e\u79ef\u5206\u7b49\u8bb0\u5f55", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserExtendsDataLog userExtendsDataLog) {
        return this.toAjax(this.userExtendsDataLogService.insertUserExtendsDataLog(userExtendsDataLog));
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:edit')")
    @Log(title="\u7528\u6237\u6570\u636e\u79ef\u5206\u7b49\u8bb0\u5f55", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserExtendsDataLog userExtendsDataLog) {
        return this.toAjax(this.userExtendsDataLogService.updateUserExtendsDataLog(userExtendsDataLog));
    }

    @PreAuthorize(value="@ss.hasPermi('system:log:remove')")
    @Log(title="\u7528\u6237\u6570\u636e\u79ef\u5206\u7b49\u8bb0\u5f55", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{userIds}"})
    public AjaxResult remove(@PathVariable Long[] userIds) {
        return this.toAjax(this.userExtendsDataLogService.deleteUserExtendsDataLogByUserIds(userIds));
    }
}
