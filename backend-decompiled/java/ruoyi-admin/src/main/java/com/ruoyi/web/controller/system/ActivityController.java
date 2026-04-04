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
 *  com.ruoyi.system.domain.Activity
 *  com.ruoyi.system.domain.ActivityExUser
 *  com.ruoyi.system.domain.ActivityModel
 *  com.ruoyi.system.domain.vo.ActivityExUserVo
 *  com.ruoyi.system.service.IActivityExUserService
 *  com.ruoyi.system.service.IActivityModelService
 *  com.ruoyi.system.service.IActivityService
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
import com.ruoyi.system.domain.Activity;
import com.ruoyi.system.domain.ActivityExUser;
import com.ruoyi.system.domain.ActivityModel;
import com.ruoyi.system.domain.vo.ActivityExUserVo;
import com.ruoyi.system.service.IActivityExUserService;
import com.ruoyi.system.service.IActivityModelService;
import com.ruoyi.system.service.IActivityService;
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
@RequestMapping(value={"/system/activity"})
public class ActivityController
extends BaseController {
    @Autowired
    private IActivityService activityService;
    @Autowired
    private IActivityExUserService activityExUserService;
    @Autowired
    private IActivityModelService iActivityModelService;

    @PreAuthorize(value="@ss.hasPermi('system:activity:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(Activity activity) {
        this.startPage();
        List list = this.activityService.selectActivityList(activity);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:activity:export')")
    @Log(title="\u6d3b\u52a8", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, Activity activity) {
        List list = this.activityService.selectActivityList(activity);
        ExcelUtil util = new ExcelUtil(Activity.class);
        util.exportExcel(response, list, "\u6d3b\u52a8\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:activity:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.activityService.selectActivityById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:activity:add')")
    @Log(title="\u6d3b\u52a8", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Activity activity) {
        ActivityModel activityModel;
        activity.setCreateUserId(this.getUserId());
        activity.setCreateName(this.getLoginUser().getUser().getLegalName());
        activity.setCreateNickName(this.getLoginUser().getUser().getNickName());
        if (null != activity.getModelId() && null != (activityModel = this.iActivityModelService.selectActivityModelById(activity.getModelId()))) {
            activity.setModelContent(activityModel.getContent());
            activity.setModelName(activityModel.getName());
        }
        return this.toAjax(this.activityService.insertActivity(activity));
    }

    @PreAuthorize(value="@ss.hasPermi('system:activity:edit')")
    @Log(title="\u6d3b\u52a8", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Activity activity) {
        ActivityModel activityModel;
        if (null != activity.getModelId() && null != (activityModel = this.iActivityModelService.selectActivityModelById(activity.getModelId()))) {
            activity.setModelContent(activityModel.getContent());
            activity.setModelName(activityModel.getName());
        }
        return this.toAjax(this.activityService.updateActivity(activity));
    }

    @PreAuthorize(value="@ss.hasPermi('system:activity:remove')")
    @Log(title="\u6d3b\u52a8", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.activityService.deleteActivityByIds(ids));
    }

    @PreAuthorize(value="@ss.hasPermi('system:actExUser:query')")
    @GetMapping(value={"/actSignList"})
    public TableDataInfo actSignList(ActivityExUser activityExUser) {
        this.startPage();
        List list = this.activityExUserService.selectActivityExUserVoList(activityExUser);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:activity:export')")
    @Log(title="\u6d3b\u52a8", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/exportExUser"})
    public void exportExUser(HttpServletResponse response, ActivityExUser activityExUser) {
        List list = this.activityExUserService.selectActivityExUserVoList(activityExUser);
        ExcelUtil util = new ExcelUtil(ActivityExUserVo.class);
        util.exportExcel(response, list, "\u6d3b\u52a8\u6570\u636e");
    }
}
