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
import com.ruoyi.system.domain.SysProgressManage;
import com.ruoyi.system.service.ISysProgressManageService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 流程管理Controller
 * 
 * @author ruoyi
 * @date 2026-02-28
 */
@RestController
@RequestMapping("/system/manage")
public class SysProgressManageController extends BaseController
{
    @Autowired
    private ISysProgressManageService sysProgressManageService;

    /**
     * 查询流程管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:manage:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysProgressManage sysProgressManage)
    {
        startPage();
        List<SysProgressManage> list = sysProgressManageService.selectSysProgressManageList(sysProgressManage);
        return getDataTable(list);
    }

    /**
     * 导出流程管理列表
     */
    @PreAuthorize("@ss.hasPermi('system:manage:export')")
    @Log(title = "流程管理", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysProgressManage sysProgressManage)
    {
        List<SysProgressManage> list = sysProgressManageService.selectSysProgressManageList(sysProgressManage);
        ExcelUtil<SysProgressManage> util = new ExcelUtil<SysProgressManage>(SysProgressManage.class);
        util.exportExcel(response, list, "流程管理数据");
    }

    /**
     * 获取流程管理详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:manage:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysProgressManageService.selectSysProgressManageById(id));
    }

    /**
     * 新增流程管理
     */
    @PreAuthorize("@ss.hasPermi('system:manage:add')")
    @Log(title = "流程管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysProgressManage sysProgressManage)
    {
        return toAjax(sysProgressManageService.insertSysProgressManage(sysProgressManage));
    }

    /**
     * 修改流程管理
     */
    @PreAuthorize("@ss.hasPermi('system:manage:edit')")
    @Log(title = "流程管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysProgressManage sysProgressManage)
    {
        return toAjax(sysProgressManageService.updateSysProgressManage(sysProgressManage));
    }

    /**
     * 删除流程管理
     */
    @PreAuthorize("@ss.hasPermi('system:manage:remove')")
    @Log(title = "流程管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysProgressManageService.deleteSysProgressManageByIds(ids));
    }
}
