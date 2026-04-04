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
 *  com.ruoyi.system.domain.VolunteerManHour
 *  com.ruoyi.system.service.IVolunteerManHourService
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
import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.service.IVolunteerManHourService;
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
@RequestMapping(value={"/system/hour"})
public class VolunteerManHourController
extends BaseController {
    @Autowired
    private IVolunteerManHourService volunteerManHourService;

    @PreAuthorize(value="@ss.hasPermi('system:hour:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(VolunteerManHour volunteerManHour) {
        this.startPage();
        List list = this.volunteerManHourService.selectVolunteerManHourList(volunteerManHour);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:hour:export')")
    @Log(title="\u5fd7\u613f\u8005\u603b\u5de5\u65f6", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, VolunteerManHour volunteerManHour) {
        List list = this.volunteerManHourService.selectVolunteerManHourList(volunteerManHour);
        ExcelUtil util = new ExcelUtil(VolunteerManHour.class);
        util.exportExcel(response, list, "\u5fd7\u613f\u8005\u603b\u5de5\u65f6\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:hour:query')")
    @GetMapping(value={"/{userId}"})
    public AjaxResult getInfo(@PathVariable(value="userId") Long userId) {
        return this.success(this.volunteerManHourService.selectVolunteerManHourByUserId(userId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:hour:add')")
    @Log(title="\u5fd7\u613f\u8005\u603b\u5de5\u65f6", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody VolunteerManHour volunteerManHour) {
        return this.toAjax(this.volunteerManHourService.insertVolunteerManHour(volunteerManHour));
    }

    @PreAuthorize(value="@ss.hasPermi('system:hour:edit')")
    @Log(title="\u5fd7\u613f\u8005\u603b\u5de5\u65f6", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody VolunteerManHour volunteerManHour) {
        return this.toAjax(this.volunteerManHourService.updateVolunteerManHour(volunteerManHour));
    }

    @PreAuthorize(value="@ss.hasPermi('system:hour:remove')")
    @Log(title="\u5fd7\u613f\u8005\u603b\u5de5\u65f6", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{userIds}"})
    public AjaxResult remove(@PathVariable Long[] userIds) {
        return this.toAjax(this.volunteerManHourService.deleteVolunteerManHourByUserIds(userIds));
    }
}
