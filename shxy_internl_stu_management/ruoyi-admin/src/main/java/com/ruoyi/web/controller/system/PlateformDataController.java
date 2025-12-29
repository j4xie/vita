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
import com.ruoyi.system.domain.PlateformData;
import com.ruoyi.system.service.IPlateformDataService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 平台设置Controller
 * 
 * @author ruoyi
 * @date 2025-09-14
 */
@RestController
@RequestMapping("/system/data")
public class PlateformDataController extends BaseController
{
    @Autowired
    private IPlateformDataService plateformDataService;

    /**
     * 查询平台设置列表
     */
    @PreAuthorize("@ss.hasPermi('system:data:list')")
    @GetMapping("/list")
    public TableDataInfo list(PlateformData plateformData)
    {
        startPage();
        List<PlateformData> list = plateformDataService.selectPlateformDataList(plateformData);
        return getDataTable(list);
    }

    /**
     * 导出平台设置列表
     */
    @PreAuthorize("@ss.hasPermi('system:data:export')")
    @Log(title = "平台设置", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, PlateformData plateformData)
    {
        List<PlateformData> list = plateformDataService.selectPlateformDataList(plateformData);
        ExcelUtil<PlateformData> util = new ExcelUtil<PlateformData>(PlateformData.class);
        util.exportExcel(response, list, "平台设置数据");
    }

    /**
     * 获取平台设置详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:data:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(plateformDataService.selectPlateformDataById(id));
    }

    /**
     * 新增平台设置
     */
    @PreAuthorize("@ss.hasPermi('system:data:add')")
    @Log(title = "平台设置", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody PlateformData plateformData)
    {
        return toAjax(plateformDataService.insertPlateformData(plateformData));
    }

    /**
     * 修改平台设置
     */
    @PreAuthorize("@ss.hasPermi('system:data:edit')")
    @Log(title = "平台设置", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody PlateformData plateformData)
    {
        return toAjax(plateformDataService.updatePlateformData(plateformData));
    }

    /**
     * 删除平台设置
     */
    @PreAuthorize("@ss.hasPermi('system:data:remove')")
    @Log(title = "平台设置", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(plateformDataService.deletePlateformDataByIds(ids));
    }
}
