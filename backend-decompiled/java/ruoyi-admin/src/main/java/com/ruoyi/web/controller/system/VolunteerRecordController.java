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
 *  com.ruoyi.system.domain.VolunteerRecord
 *  com.ruoyi.system.service.IVolunteerManHourService
 *  com.ruoyi.system.service.IVolunteerRecordService
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
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.service.IVolunteerManHourService;
import com.ruoyi.system.service.IVolunteerRecordService;
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
@RequestMapping(value={"/system/record"})
public class VolunteerRecordController
extends BaseController {
    @Autowired
    private IVolunteerRecordService volunteerRecordService;
    @Autowired
    private IVolunteerManHourService volunteerManHourService;

    @PreAuthorize(value="@ss.hasPermi('system:record:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(VolunteerRecord volunteerRecord) {
        this.startPage();
        List list = this.volunteerRecordService.selectVolunteerRecordList(volunteerRecord);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:record:export')")
    @Log(title="\u5fd7\u613f\u8005\u6253\u5361\u8bb0\u5f55", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, VolunteerRecord volunteerRecord) {
        List list = this.volunteerRecordService.selectVolunteerRecordList(volunteerRecord);
        ExcelUtil util = new ExcelUtil(VolunteerRecord.class);
        util.exportExcel(response, list, "\u5fd7\u613f\u8005\u6253\u5361\u8bb0\u5f55\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:record:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.volunteerRecordService.selectVolunteerRecordById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:record:add')")
    @Log(title="\u5fd7\u613f\u8005\u6253\u5361\u8bb0\u5f55", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody VolunteerRecord volunteerRecord) {
        return this.toAjax(this.volunteerRecordService.insertVolunteerRecord(volunteerRecord));
    }

    @PreAuthorize(value="@ss.hasPermi('system:record:edit')")
    @Log(title="\u5fd7\u613f\u8005\u6253\u5361\u8bb0\u5f55", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody VolunteerRecord volunteerRecord) {
        return this.toAjax(this.volunteerRecordService.updateVolunteerRecord(volunteerRecord));
    }

    @PreAuthorize(value="@ss.hasPermi('system:record:edit')")
    @Log(title="\u5fd7\u613f\u8005\u6253\u5361\u5ba1\u6838", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/audit"})
    public AjaxResult audit(@RequestBody VolunteerRecord volunteerRecord) {
        volunteerRecord.setAuditLegalName(this.getLoginUser().getUser().getLegalName());
        int count = this.volunteerRecordService.updateVolunteerRecord(volunteerRecord);
        if (count > 0) {
            if (volunteerRecord.getStatus() == 1L) {
                long diff = volunteerRecord.getEndTime().getTime() - volunteerRecord.getStartTime().getTime();
                long diffMinutes = diff / 60000L;
                VolunteerManHour volunteerManHour = this.volunteerManHourService.selectVolunteerManHourByUserId(volunteerRecord.getUserId());
                if (null != volunteerManHour) {
                    Long totalMinutes = volunteerManHour.getTotalMinutes() + diffMinutes;
                    VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                    volunteerManHourVo.setUserId(volunteerRecord.getUserId());
                    volunteerManHourVo.setTotalMinutes(totalMinutes);
                    this.volunteerManHourService.updateVolunteerManHour(volunteerManHourVo);
                } else {
                    VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                    volunteerManHourVo.setUserId(volunteerRecord.getUserId());
                    volunteerManHourVo.setTotalMinutes(Long.valueOf(diffMinutes));
                    this.volunteerManHourService.insertVolunteerManHour(volunteerManHourVo);
                }
            }
            AjaxResult ajaxResult = AjaxResult.success();
            return ajaxResult;
        }
        AjaxResult ajaxResult = AjaxResult.error();
        ajaxResult.put("msg", (Object)"\u64cd\u4f5c\u5931\u8d25");
        return ajaxResult;
    }

    @PreAuthorize(value="@ss.hasPermi('system:record:remove')")
    @Log(title="\u5fd7\u613f\u8005\u6253\u5361\u8bb0\u5f55", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.volunteerRecordService.deleteVolunteerRecordByIds(ids));
    }
}
