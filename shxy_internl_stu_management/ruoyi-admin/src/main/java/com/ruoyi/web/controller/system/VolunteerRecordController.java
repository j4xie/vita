package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;

import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.service.IVolunteerManHourService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.VolunteerRecord;
import com.ruoyi.system.service.IVolunteerRecordService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 志愿者打卡记录Controller
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
@RestController
@RequestMapping("/system/record")
public class VolunteerRecordController extends BaseController
{
    @Autowired
    private IVolunteerRecordService volunteerRecordService;

    @Autowired
    private IVolunteerManHourService volunteerManHourService;

    /**
     * 查询志愿者打卡记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:record:list')")
    @GetMapping("/list")
    public TableDataInfo list(VolunteerRecord volunteerRecord)
    {
        startPage();
        List<VolunteerRecord> list = volunteerRecordService.selectVolunteerRecordList(volunteerRecord);
        return getDataTable(list);
    }

    /**
     * 导出志愿者打卡记录列表
     */
    @PreAuthorize("@ss.hasPermi('system:record:export')")
    @Log(title = "志愿者打卡记录", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, VolunteerRecord volunteerRecord)
    {
        List<VolunteerRecord> list = volunteerRecordService.selectVolunteerRecordList(volunteerRecord);
        ExcelUtil<VolunteerRecord> util = new ExcelUtil<VolunteerRecord>(VolunteerRecord.class);
        util.exportExcel(response, list, "志愿者打卡记录数据");
    }

    /**
     * 获取志愿者打卡记录详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:record:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(volunteerRecordService.selectVolunteerRecordById(id));
    }

    /**
     * 新增志愿者打卡记录
     */
    @PreAuthorize("@ss.hasPermi('system:record:add')")
    @Log(title = "志愿者打卡记录", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody VolunteerRecord volunteerRecord)
    {
        return toAjax(volunteerRecordService.insertVolunteerRecord(volunteerRecord));
    }

    /**
     * 修改志愿者打卡记录
     */
    @PreAuthorize("@ss.hasPermi('system:record:edit')")
    @Log(title = "志愿者打卡记录", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody VolunteerRecord volunteerRecord)
    {
        return toAjax(volunteerRecordService.updateVolunteerRecord(volunteerRecord));
    }

    /**
     * 志愿者打卡审核
     */
    @PreAuthorize("@ss.hasPermi('system:record:edit')")
    @Log(title = "志愿者打卡审核", businessType = BusinessType.UPDATE)
    @PostMapping(value = "/audit")
    public AjaxResult audit(@RequestBody VolunteerRecord volunteerRecord)
    {
        volunteerRecord.setAuditLegalName(getLoginUser().getUser().getLegalName());
        int count = volunteerRecordService.updateVolunteerRecord(volunteerRecord);
        if(count > 0){
            if(volunteerRecord.getStatus() == 1){
                // 计算时间差
                long diff = volunteerRecord.getEndTime().getTime() - volunteerRecord.getStartTime().getTime(); // 得到毫秒差
                long diffMinutes = diff / (60 * 1000); // 转换为分钟
                VolunteerManHour volunteerManHour = volunteerManHourService.selectVolunteerManHourByUserId(volunteerRecord.getUserId());
                if(null != volunteerManHour){
                    //更新
                    Long totalMinutes = volunteerManHour.getTotalMinutes() + diffMinutes;
                    VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                    volunteerManHourVo.setUserId(volunteerRecord.getUserId());
                    volunteerManHourVo.setTotalMinutes(totalMinutes);
                    volunteerManHourService.updateVolunteerManHour(volunteerManHourVo);
                }else{
                    //新增
                    VolunteerManHour volunteerManHourVo = new VolunteerManHour();
                    volunteerManHourVo.setUserId(volunteerRecord.getUserId());
                    volunteerManHourVo.setTotalMinutes(diffMinutes);
                    volunteerManHourService.insertVolunteerManHour(volunteerManHourVo);
                }
            }

            AjaxResult ajaxResult = AjaxResult.success();
            return ajaxResult;
        }else{
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "操作失败");
            return ajaxResult;
        }
    }

    /**
     * 删除志愿者打卡记录
     */
    @PreAuthorize("@ss.hasPermi('system:record:remove')")
    @Log(title = "志愿者打卡记录", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(volunteerRecordService.deleteVolunteerRecordByIds(ids));
    }
}
