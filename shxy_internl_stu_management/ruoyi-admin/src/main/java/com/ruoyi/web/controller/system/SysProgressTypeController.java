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
import com.ruoyi.system.domain.SysProgressType;
import com.ruoyi.system.service.ISysProgressTypeService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 流程分类Controller
 * 
 * @author ruoyi
 * @date 2026-03-24
 */
@RestController
@RequestMapping("/system/progressType")
public class SysProgressTypeController extends BaseController
{
    @Autowired
    private ISysProgressTypeService sysProgressTypeService;

    /**
     * 查询流程分类列表
     */
    @PreAuthorize("@ss.hasPermi('system:progressType:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysProgressType sysProgressType)
    {
        startPage();
        List<SysProgressType> list = sysProgressTypeService.selectSysProgressTypeList(sysProgressType);
        return getDataTable(list);
    }

    /**
     * 导出流程分类列表
     */
    @PreAuthorize("@ss.hasPermi('system:progressType:export')")
    @Log(title = "流程分类", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysProgressType sysProgressType)
    {
        List<SysProgressType> list = sysProgressTypeService.selectSysProgressTypeList(sysProgressType);
        ExcelUtil<SysProgressType> util = new ExcelUtil<SysProgressType>(SysProgressType.class);
        util.exportExcel(response, list, "流程分类数据");
    }

    /**
     * 获取流程分类详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:progressType:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysProgressTypeService.selectSysProgressTypeById(id));
    }

    /**
     * 新增流程分类
     */
    @PreAuthorize("@ss.hasPermi('system:progressType:add')")
    @Log(title = "流程分类", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysProgressType sysProgressType)
    {
        return toAjax(sysProgressTypeService.insertSysProgressType(sysProgressType));
    }

    /**
     * 修改流程分类
     */
    @PreAuthorize("@ss.hasPermi('system:progressType:edit')")
    @Log(title = "流程分类", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysProgressType sysProgressType)
    {
        return toAjax(sysProgressTypeService.updateSysProgressType(sysProgressType));
    }

    /**
     * 删除流程分类
     */
    @PreAuthorize("@ss.hasPermi('system:progressType:remove')")
    @Log(title = "流程分类", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysProgressTypeService.deleteSysProgressTypeByIds(ids));
    }
}
