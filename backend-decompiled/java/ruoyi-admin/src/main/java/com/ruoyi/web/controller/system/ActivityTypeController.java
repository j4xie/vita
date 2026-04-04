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
 *  com.ruoyi.system.domain.ActivityType
 *  com.ruoyi.system.service.IActivityTypeService
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
import com.ruoyi.system.domain.ActivityType;
import com.ruoyi.system.service.IActivityTypeService;
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
@RequestMapping(value={"/system/type"})
public class ActivityTypeController
extends BaseController {
    @Autowired
    private IActivityTypeService activityTypeService;

    @PreAuthorize(value="@ss.hasPermi('system:type:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(ActivityType activityType) {
        this.startPage();
        List list = this.activityTypeService.selectActivityTypeList(activityType);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:type:list')")
    @GetMapping(value={"/allList"})
    public TableDataInfo allList(ActivityType activityType) {
        List list = this.activityTypeService.selectActivityTypeList(activityType);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:type:export')")
    @Log(title="\u6d3b\u52a8\u7c7b\u578b", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, ActivityType activityType) {
        List list = this.activityTypeService.selectActivityTypeList(activityType);
        ExcelUtil util = new ExcelUtil(ActivityType.class);
        util.exportExcel(response, list, "\u6d3b\u52a8\u7c7b\u578b\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:type:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.activityTypeService.selectActivityTypeById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:type:add')")
    @Log(title="\u6d3b\u52a8\u7c7b\u578b", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ActivityType activityType) {
        return this.toAjax(this.activityTypeService.insertActivityType(activityType));
    }

    @PreAuthorize(value="@ss.hasPermi('system:type:edit')")
    @Log(title="\u6d3b\u52a8\u7c7b\u578b", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ActivityType activityType) {
        return this.toAjax(this.activityTypeService.updateActivityType(activityType));
    }

    @PreAuthorize(value="@ss.hasPermi('system:type:remove')")
    @Log(title="\u6d3b\u52a8\u7c7b\u578b", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.activityTypeService.deleteActivityTypeByIds(ids));
    }
}
