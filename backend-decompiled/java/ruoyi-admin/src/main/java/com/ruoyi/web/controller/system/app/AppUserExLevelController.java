/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.system.domain.SysUserExLevel
 *  com.ruoyi.system.domain.SysUserLevel
 *  com.ruoyi.system.service.ISysUserExLevelService
 *  com.ruoyi.system.service.ISysUserLevelService
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
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.system.service.ISysUserLevelService;
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
@RequestMapping(value={"/app/userExLevel"})
public class AppUserExLevelController
extends BaseController {
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;
    @Autowired
    private ISysUserLevelService sysUserLevelService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/info"})
    public AjaxResult getInfo(Long userId) {
        if (null == userId) {
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u7528\u6237id\u53c2\u6570\u7f3a\u5931");
            return ajaxResult;
        }
        SysUserExLevel sysUserExLevel = this.sysUserExLevelService.selectSysUserExLevelByUserId(userId);
        if (null != sysUserExLevel) {
            SysUserLevel sysUserLevel = this.sysUserLevelService.selectSysUserLevelById(sysUserExLevel.getLevelId());
            sysUserExLevel.setSysUserLevel(sysUserLevel);
        }
        return this.success(sysUserExLevel);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u7528\u6237\u5bf9\u5e94\u4f1a\u5458\u7b49\u7ea7", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysUserExLevel sysUserExLevel) {
        return this.toAjax(this.sysUserExLevelService.insertSysUserExLevel(sysUserExLevel));
    }

    @PreAuthorize(value="@ss.hasPermi('system:level:edit')")
    @Log(title="\u7528\u6237\u5bf9\u5e94\u4f1a\u5458\u7b49\u7ea7", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysUserExLevel sysUserExLevel) {
        return this.toAjax(this.sysUserExLevelService.updateSysUserExLevel(sysUserExLevel));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u7528\u6237\u5bf9\u5e94\u4f1a\u5458\u7b49\u7ea7", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysUserExLevelService.deleteSysUserExLevelByIds(ids));
    }
}
