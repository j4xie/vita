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
import com.ruoyi.system.domain.ActivityModel;
import com.ruoyi.system.service.IActivityModelService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 活动模板Controller
 * 
 * @author ruoyi
 * @date 2025-10-24
 */
@RestController
@RequestMapping("/system/model")
public class ActivityModelController extends BaseController
{
    @Autowired
    private IActivityModelService activityModelService;

    /**
     * 查询活动模板列表
     */
    @PreAuthorize("@ss.hasPermi('system:model:list')")
    @GetMapping("/list")
    public TableDataInfo list(ActivityModel activityModel)
    {
        startPage();
        List<ActivityModel> list = activityModelService.selectActivityModelList(activityModel);
        return getDataTable(list);
    }

    /**
     * 导出活动模板列表
     */
    @PreAuthorize("@ss.hasPermi('system:model:export')")
    @Log(title = "活动模板", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, ActivityModel activityModel)
    {
        List<ActivityModel> list = activityModelService.selectActivityModelList(activityModel);
        ExcelUtil<ActivityModel> util = new ExcelUtil<ActivityModel>(ActivityModel.class);
        util.exportExcel(response, list, "活动模板数据");
    }

    /**
     * 获取活动模板详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:model:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(activityModelService.selectActivityModelById(id));
    }

    /**
     * 新增活动模板
     */
    @PreAuthorize("@ss.hasPermi('system:model:add')")
    @Log(title = "活动模板", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ActivityModel activityModel)
    {
        return toAjax(activityModelService.insertActivityModel(activityModel));
    }

    /**
     * 修改活动模板
     */
    @PreAuthorize("@ss.hasPermi('system:model:edit')")
    @Log(title = "活动模板", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ActivityModel activityModel)
    {
        return toAjax(activityModelService.updateActivityModel(activityModel));
    }

    /**
     * 删除活动模板
     */
    @PreAuthorize("@ss.hasPermi('system:model:remove')")
    @Log(title = "活动模板", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(activityModelService.deleteActivityModelByIds(ids));
    }
}
