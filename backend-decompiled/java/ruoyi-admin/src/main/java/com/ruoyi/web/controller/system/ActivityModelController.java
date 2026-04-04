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
 *  com.ruoyi.system.domain.ActivityModel
 *  com.ruoyi.system.service.IActivityModelService
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
import com.ruoyi.system.domain.ActivityModel;
import com.ruoyi.system.service.IActivityModelService;
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
@RequestMapping(value={"/system/model"})
public class ActivityModelController
extends BaseController {
    @Autowired
    private IActivityModelService activityModelService;

    @PreAuthorize(value="@ss.hasPermi('system:model:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(ActivityModel activityModel) {
        this.startPage();
        List list = this.activityModelService.selectActivityModelList(activityModel);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:model:export')")
    @Log(title="\u6d3b\u52a8\u6a21\u677f", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, ActivityModel activityModel) {
        List list = this.activityModelService.selectActivityModelList(activityModel);
        ExcelUtil util = new ExcelUtil(ActivityModel.class);
        util.exportExcel(response, list, "\u6d3b\u52a8\u6a21\u677f\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:model:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.activityModelService.selectActivityModelById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:model:add')")
    @Log(title="\u6d3b\u52a8\u6a21\u677f", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ActivityModel activityModel) {
        return this.toAjax(this.activityModelService.insertActivityModel(activityModel));
    }

    @PreAuthorize(value="@ss.hasPermi('system:model:edit')")
    @Log(title="\u6d3b\u52a8\u6a21\u677f", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ActivityModel activityModel) {
        return this.toAjax(this.activityModelService.updateActivityModel(activityModel));
    }

    @PreAuthorize(value="@ss.hasPermi('system:model:remove')")
    @Log(title="\u6d3b\u52a8\u6a21\u677f", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.activityModelService.deleteActivityModelByIds(ids));
    }
}
