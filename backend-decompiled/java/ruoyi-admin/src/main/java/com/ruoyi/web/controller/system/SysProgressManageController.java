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
 *  com.ruoyi.system.domain.SysProgressManage
 *  com.ruoyi.system.service.ISysProgressManageService
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
import com.ruoyi.system.domain.SysProgressManage;
import com.ruoyi.system.service.ISysProgressManageService;
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
@RequestMapping(value={"/system/manage"})
public class SysProgressManageController
extends BaseController {
    @Autowired
    private ISysProgressManageService sysProgressManageService;

    @PreAuthorize(value="@ss.hasPermi('system:manage:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysProgressManage sysProgressManage) {
        this.startPage();
        List list = this.sysProgressManageService.selectSysProgressManageList(sysProgressManage);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:manage:export')")
    @Log(title="\u6d41\u7a0b\u7ba1\u7406", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysProgressManage sysProgressManage) {
        List list = this.sysProgressManageService.selectSysProgressManageList(sysProgressManage);
        ExcelUtil util = new ExcelUtil(SysProgressManage.class);
        util.exportExcel(response, list, "\u6d41\u7a0b\u7ba1\u7406\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:manage:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.sysProgressManageService.selectSysProgressManageById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:manage:add')")
    @Log(title="\u6d41\u7a0b\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysProgressManage sysProgressManage) {
        return this.toAjax(this.sysProgressManageService.insertSysProgressManage(sysProgressManage));
    }

    @PreAuthorize(value="@ss.hasPermi('system:manage:edit')")
    @Log(title="\u6d41\u7a0b\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysProgressManage sysProgressManage) {
        return this.toAjax(this.sysProgressManageService.updateSysProgressManage(sysProgressManage));
    }

    @PreAuthorize(value="@ss.hasPermi('system:manage:remove')")
    @Log(title="\u6d41\u7a0b\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysProgressManageService.deleteSysProgressManageByIds(ids));
    }
}
