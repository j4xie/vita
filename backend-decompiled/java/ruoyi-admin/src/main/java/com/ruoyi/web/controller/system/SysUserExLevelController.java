/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.SysUserExLevel
 *  com.ruoyi.system.service.ISysUserExLevelService
 *  com.ruoyi.system.service.ISysUserService
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
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.system.service.ISysUserService;
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
@RequestMapping(value={"/system/userExLevel"})
public class SysUserExLevelController
extends BaseController {
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;
    @Autowired
    private ISysUserService sysUserService;

    @PreAuthorize(value="@ss.hasPermi('system:level:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysUserExLevel sysUserExLevel) {
        this.startPage();
        List list = this.sysUserExLevelService.selectSysUserExLevelList(sysUserExLevel);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:level:export')")
    @Log(title="\u7528\u6237\u5bf9\u5e94\u4f1a\u5458\u7b49\u7ea7", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysUserExLevel sysUserExLevel) {
        List list = this.sysUserExLevelService.selectSysUserExLevelList(sysUserExLevel);
        ExcelUtil util = new ExcelUtil(SysUserExLevel.class);
        util.exportExcel(response, list, "\u7528\u6237\u5bf9\u5e94\u4f1a\u5458\u7b49\u7ea7\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:level:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.sysUserExLevelService.selectSysUserExLevelById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:level:add')")
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

    @PreAuthorize(value="@ss.hasPermi('system:level:remove')")
    @Log(title="\u7528\u6237\u5bf9\u5e94\u4f1a\u5458\u7b49\u7ea7", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysUserExLevelService.deleteSysUserExLevelByIds(ids));
    }

    @PreAuthorize(value="@ss.hasPermi('system:level:add')")
    @Log(title="\u6388\u4e88\u4f1a\u5458\u7b49\u7ea7", businessType=BusinessType.INSERT)
    @PostMapping(value={"/grantLevel"})
    public AjaxResult grantLevel(@RequestBody SysUserExLevel sysUserExLevel) {
        SysUser sysUser = this.sysUserService.selectUserByPhoneNumber(sysUserExLevel.getMobile());
        sysUserExLevel.setUserId(sysUser.getUserId());
        return this.toAjax(this.sysUserExLevelService.insertSysUserExLevel(sysUserExLevel));
    }
}
