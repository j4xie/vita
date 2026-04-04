/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.system.domain.VolunteerManHour
 *  com.ruoyi.system.domain.VolunteerRecord
 *  com.ruoyi.system.service.IVolunteerManHourService
 *  com.ruoyi.system.service.IVolunteerRecordService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.transaction.annotation.Transactional
 *  org.springframework.transaction.interceptor.TransactionAspectSupport
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.service.IVolunteerManHourService;
import com.ruoyi.system.service.IVolunteerRecordService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/hour"})
public class AppVolunteerController
extends BaseController {
    @Autowired
    private IVolunteerManHourService volunteerManHourService;
    @Autowired
    private IVolunteerRecordService volunteerRecordService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/hourList"})
    public TableDataInfo list(VolunteerManHour volunteerManHour) {
        this.startPage();
        List list = this.volunteerManHourService.selectVolunteerManHourListForApp(volunteerManHour);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/recordList"})
    public TableDataInfo list(VolunteerRecord volunteerRecord) {
        this.startPage();
        List list = this.volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecord);
        return this.getDataTable(list);
    }

    @GetMapping(value={"/userHour"})
    public AjaxResult userHour(Long userId) {
        VolunteerManHour volunteerManHourDTO = this.volunteerManHourService.selectVolunteerManHourByUserId(userId);
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("data", (Object)volunteerManHourDTO);
        return ajaxResult;
    }

    @Transactional(rollbackFor={Exception.class})
    @Log(title="\u5fd7\u613f\u8005\u7b7e\u5230/\u7b7e\u9000", businessType=BusinessType.UPDATE)
    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/signRecord"})
    public AjaxResult add(VolunteerRecord volunteerRecord) {
        try {
            int count = 0;
            if (null != volunteerRecord && volunteerRecord.getType() == 1L) {
                VolunteerRecord volunteerRecordDTO = new VolunteerRecord();
                volunteerRecordDTO.setUserId(volunteerRecord.getUserId());
                volunteerRecordDTO.setType(volunteerRecord.getType());
                List list = this.volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecordDTO);
                if (list.size() > 0) {
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", (Object)"\u5b58\u5728\u672a\u7b7e\u9000\u7684\u8bb0\u5f55\uff0c\u8bf7\u5148\u7b7e\u9000");
                    return ajaxResult;
                }
                volunteerRecordDTO.setStartTime(volunteerRecord.getStartTime());
                volunteerRecordDTO.setOperateUserId(volunteerRecord.getOperateUserId());
                volunteerRecordDTO.setOperateLegalName(volunteerRecord.getOperateLegalName());
                count = this.volunteerRecordService.insertVolunteerRecord(volunteerRecord);
            } else if (null != volunteerRecord && volunteerRecord.getType() == 2L) {
                if (null == volunteerRecord.getId()) {
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", (Object)"\u53c2\u6570\u5f02\u5e38");
                    return ajaxResult;
                }
                VolunteerRecord volunteerRecordDTO = new VolunteerRecord();
                volunteerRecordDTO.setId(volunteerRecord.getId());
                volunteerRecordDTO.setType(Long.valueOf(1L));
                List list = this.volunteerRecordService.selectVolunteerRecordListFroApp(volunteerRecordDTO);
                if (list.size() <= 0) {
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", (Object)"\u6682\u65e0\u9700\u8981\u7b7e\u9000\u7684\u8bb0\u5f55");
                    return ajaxResult;
                }
                volunteerRecordDTO.setEndTime(volunteerRecord.getEndTime());
                volunteerRecordDTO.setType(volunteerRecord.getType());
                volunteerRecordDTO.setOperateUserId(volunteerRecord.getOperateUserId());
                volunteerRecordDTO.setOperateLegalName(volunteerRecord.getOperateLegalName());
                volunteerRecordDTO.setRemark(volunteerRecord.getRemark());
                if (null != volunteerRecord.getStatus() && volunteerRecord.getStatus() == 1L) {
                    volunteerRecordDTO.setStatus(volunteerRecord.getStatus());
                }
                if ((count = this.volunteerRecordService.updateVolunteerRecord(volunteerRecordDTO)) > 0 && null != volunteerRecord.getStatus() && volunteerRecord.getStatus() == 1L) {
                    VolunteerRecord volunteerRecordVo = this.volunteerRecordService.selectVolunteerRecordById(volunteerRecord.getId());
                    long diff = volunteerRecordVo.getEndTime().getTime() - volunteerRecordVo.getStartTime().getTime();
                    long diffMinutes = diff / 60000L;
                    VolunteerManHour volunteerManHour = this.volunteerManHourService.selectVolunteerManHourByUserId(volunteerRecordVo.getUserId());
                    if (null != volunteerManHour) {
                        Long totalMinutes = volunteerManHour.getTotalMinutes() + diffMinutes;
                        VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                        volunteerManHourVo.setUserId(volunteerRecordVo.getUserId());
                        volunteerManHourVo.setTotalMinutes(totalMinutes);
                        this.volunteerManHourService.updateVolunteerManHour(volunteerManHourVo);
                    } else {
                        VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                        volunteerManHourVo.setUserId(volunteerRecordVo.getUserId());
                        volunteerManHourVo.setTotalMinutes(Long.valueOf(diffMinutes));
                        this.volunteerManHourService.insertVolunteerManHour(volunteerManHourVo);
                    }
                }
            }
            return this.toAjax(count);
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u64cd\u4f5c\u5931\u8d25");
            return ajaxResult;
        }
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/lastRecordList"})
    public AjaxResult lastRecordList(VolunteerRecord volunteerRecord) {
        AjaxResult ajaxResult = null;
        volunteerRecord.setType(Long.valueOf(1L));
        VolunteerRecord volunteerRecordDTO = this.volunteerRecordService.selectVolunteerLastRecordFroApp(volunteerRecord);
        if (null != volunteerRecordDTO) {
            ajaxResult = AjaxResult.success();
            ajaxResult.put("data", (Object)volunteerRecordDTO);
        } else {
            ajaxResult = AjaxResult.success();
            ajaxResult.put("data", (Object)new Object[0]);
        }
        return ajaxResult;
    }
}
