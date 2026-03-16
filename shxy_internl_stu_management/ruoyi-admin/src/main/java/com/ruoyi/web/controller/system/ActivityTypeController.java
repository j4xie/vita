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
import com.ruoyi.system.domain.ActivityType;
import com.ruoyi.system.service.IActivityTypeService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 活动类型Controller
 * 
 * @author ruoyi
 * @date 2026-03-16
 */
@RestController
@RequestMapping("/system/type")
public class ActivityTypeController extends BaseController
{
    @Autowired
    private IActivityTypeService activityTypeService;

    /**
     * 查询活动类型列表
     */
    @PreAuthorize("@ss.hasPermi('system:type:list')")
    @GetMapping("/list")
    public TableDataInfo list(ActivityType activityType)
    {
        startPage();
        List<ActivityType> list = activityTypeService.selectActivityTypeList(activityType);
        return getDataTable(list);
    }

    /**
     * 查询全部活动类型列表
     */
    @PreAuthorize("@ss.hasPermi('system:type:list')")
    @GetMapping("/allList")
    public TableDataInfo allList(ActivityType activityType)
    {
        List<ActivityType> list = activityTypeService.selectActivityTypeList(activityType);
        return getDataTable(list);
    }

    /**
     * 导出活动类型列表
     */
    @PreAuthorize("@ss.hasPermi('system:type:export')")
    @Log(title = "活动类型", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, ActivityType activityType)
    {
        List<ActivityType> list = activityTypeService.selectActivityTypeList(activityType);
        ExcelUtil<ActivityType> util = new ExcelUtil<ActivityType>(ActivityType.class);
        util.exportExcel(response, list, "活动类型数据");
    }

    /**
     * 获取活动类型详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:type:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(activityTypeService.selectActivityTypeById(id));
    }

    /**
     * 新增活动类型
     */
    @PreAuthorize("@ss.hasPermi('system:type:add')")
    @Log(title = "活动类型", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ActivityType activityType)
    {
        return toAjax(activityTypeService.insertActivityType(activityType));
    }

    /**
     * 修改活动类型
     */
    @PreAuthorize("@ss.hasPermi('system:type:edit')")
    @Log(title = "活动类型", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ActivityType activityType)
    {
        return toAjax(activityTypeService.updateActivityType(activityType));
    }

    /**
     * 删除活动类型
     */
    @PreAuthorize("@ss.hasPermi('system:type:remove')")
    @Log(title = "活动类型", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(activityTypeService.deleteActivityTypeByIds(ids));
    }
}
