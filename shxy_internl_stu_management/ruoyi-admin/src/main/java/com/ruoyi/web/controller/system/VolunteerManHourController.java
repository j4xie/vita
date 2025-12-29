package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;
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
import com.ruoyi.system.domain.VolunteerManHour;
import com.ruoyi.system.service.IVolunteerManHourService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 志愿者总工时Controller
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
@RestController
@RequestMapping("/system/hour")
public class VolunteerManHourController extends BaseController
{
    @Autowired
    private IVolunteerManHourService volunteerManHourService;

    /**
     * 查询志愿者总工时列表
     */
    @PreAuthorize("@ss.hasPermi('system:hour:list')")
    @GetMapping("/list")
    public TableDataInfo list(VolunteerManHour volunteerManHour)
    {
        startPage();
        List<VolunteerManHour> list = volunteerManHourService.selectVolunteerManHourList(volunteerManHour);
        return getDataTable(list);
    }

    /**
     * 导出志愿者总工时列表
     */
    @PreAuthorize("@ss.hasPermi('system:hour:export')")
    @Log(title = "志愿者总工时", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, VolunteerManHour volunteerManHour)
    {
        List<VolunteerManHour> list = volunteerManHourService.selectVolunteerManHourList(volunteerManHour);
        ExcelUtil<VolunteerManHour> util = new ExcelUtil<VolunteerManHour>(VolunteerManHour.class);
        util.exportExcel(response, list, "志愿者总工时数据");
    }

    /**
     * 获取志愿者总工时详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:hour:query')")
    @GetMapping(value = "/{userId}")
    public AjaxResult getInfo(@PathVariable("userId") Long userId)
    {
        return success(volunteerManHourService.selectVolunteerManHourByUserId(userId));
    }

    /**
     * 新增志愿者总工时
     */
    @PreAuthorize("@ss.hasPermi('system:hour:add')")
    @Log(title = "志愿者总工时", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody VolunteerManHour volunteerManHour)
    {
        return toAjax(volunteerManHourService.insertVolunteerManHour(volunteerManHour));
    }

    /**
     * 修改志愿者总工时
     */
    @PreAuthorize("@ss.hasPermi('system:hour:edit')")
    @Log(title = "志愿者总工时", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody VolunteerManHour volunteerManHour)
    {
        return toAjax(volunteerManHourService.updateVolunteerManHour(volunteerManHour));
    }

    /**
     * 删除志愿者总工时
     */
    @PreAuthorize("@ss.hasPermi('system:hour:remove')")
    @Log(title = "志愿者总工时", businessType = BusinessType.DELETE)
	@DeleteMapping("/{userIds}")
    public AjaxResult remove(@PathVariable Long[] userIds)
    {
        return toAjax(volunteerManHourService.deleteVolunteerManHourByUserIds(userIds));
    }
}
