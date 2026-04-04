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
 *  com.ruoyi.framework.web.service.SysPasswordService
 *  com.ruoyi.system.domain.SysLogininfor
 *  com.ruoyi.system.service.ISysLogininforService
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.monitor;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.framework.web.service.SysPasswordService;
import com.ruoyi.system.domain.SysLogininfor;
import com.ruoyi.system.service.ISysLogininforService;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/monitor/logininfor"})
public class SysLogininforController
extends BaseController {
    @Autowired
    private ISysLogininforService logininforService;
    @Autowired
    private SysPasswordService passwordService;

    @PreAuthorize(value="@ss.hasPermi('monitor:logininfor:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysLogininfor logininfor) {
        this.startPage();
        List list = this.logininforService.selectLogininforList(logininfor);
        return this.getDataTable(list);
    }

    @Log(title="\u767b\u5f55\u65e5\u5fd7", businessType=BusinessType.EXPORT)
    @PreAuthorize(value="@ss.hasPermi('monitor:logininfor:export')")
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysLogininfor logininfor) {
        List list = this.logininforService.selectLogininforList(logininfor);
        ExcelUtil util = new ExcelUtil(SysLogininfor.class);
        util.exportExcel(response, list, "\u767b\u5f55\u65e5\u5fd7");
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:logininfor:remove')")
    @Log(title="\u767b\u5f55\u65e5\u5fd7", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{infoIds}"})
    public AjaxResult remove(@PathVariable Long[] infoIds) {
        return this.toAjax(this.logininforService.deleteLogininforByIds(infoIds));
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:logininfor:remove')")
    @Log(title="\u767b\u5f55\u65e5\u5fd7", businessType=BusinessType.CLEAN)
    @DeleteMapping(value={"/clean"})
    public AjaxResult clean() {
        this.logininforService.cleanLogininfor();
        return this.success();
    }

    @PreAuthorize(value="@ss.hasPermi('monitor:logininfor:unlock')")
    @Log(title="\u8d26\u6237\u89e3\u9501", businessType=BusinessType.OTHER)
    @GetMapping(value={"/unlock/{userName}"})
    public AjaxResult unlock(@PathVariable(value="userName") String userName) {
        this.passwordService.clearLoginRecordCache(userName);
        return this.success();
    }
}
