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
import com.ruoyi.system.domain.SysProgressTemplate;
import com.ruoyi.system.service.ISysProgressTemplateService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 流程管理Controller
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
@RestController
@RequestMapping("/system/template")
public class SysProgressTemplateController extends BaseController
{
    @Autowired
    private ISysProgressTemplateService sysProgressTemplateService;

    /**
     * 查询流程管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:template:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysProgressTemplate sysProgressTemplate)
    {
        startPage();
        List<SysProgressTemplate> list = sysProgressTemplateService.selectSysProgressTemplateList(sysProgressTemplate);
        return getDataTable(list);
    }

    /**
     * 导出流程管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:template:export')")
    @Log(title = "流程管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysProgressTemplate sysProgressTemplate)
    {
        List<SysProgressTemplate> list = sysProgressTemplateService.selectSysProgressTemplateList(sysProgressTemplate);
        ExcelUtil<SysProgressTemplate> util = new ExcelUtil<SysProgressTemplate>(SysProgressTemplate.class);
        util.exportExcel(response, list, "流程管理数据");
    }

    /**
     * 获取流程管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:template:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysProgressTemplateService.selectSysProgressTemplateById(id));
    }

    /**
     * 新增流程管理
     */
    @PreAuthorize("@ss.hasPermi('system:template:add')")
    @Log(title = "流程管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysProgressTemplate sysProgressTemplate)
    {
        return toAjax(sysProgressTemplateService.insertSysProgressTemplate(sysProgressTemplate));
    }

    /**
     * 修改流程管理
     */
    @PreAuthorize("@ss.hasPermi('system:template:edit')")
    @Log(title = "流程管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysProgressTemplate sysProgressTemplate)
    {
        return toAjax(sysProgressTemplateService.updateSysProgressTemplate(sysProgressTemplate));
    }

    /**
     * 删除流程管理
     */
    @PreAuthorize("@ss.hasPermi('system:template:remove')")
    @Log(title = "流程管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysProgressTemplateService.deleteSysProgressTemplateByIds(ids));
    }
}
