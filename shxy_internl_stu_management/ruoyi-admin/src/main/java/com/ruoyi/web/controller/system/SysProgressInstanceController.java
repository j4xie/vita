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
import com.ruoyi.system.domain.SysProgressInstance;
import com.ruoyi.system.service.ISysProgressInstanceService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 审批实例Controller
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
@RestController
@RequestMapping("/system/instance")
public class SysProgressInstanceController extends BaseController
{
    @Autowired
    private ISysProgressInstanceService sysProgressInstanceService;

    /**
     * 查询审批实例列表
     */
    @PreAuthorize("@ss.hasPermi('system:instance:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysProgressInstance sysProgressInstance)
    {
        startPage();
        List<SysProgressInstance> list = sysProgressInstanceService.selectSysProgressInstanceList(sysProgressInstance);
        return getDataTable(list);
    }

    /**
     * 导出审批实例列表
     */
    @PreAuthorize("@ss.hasPermi('system:instance:export')")
    @Log(title = "审批实例", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysProgressInstance sysProgressInstance)
    {
        List<SysProgressInstance> list = sysProgressInstanceService.selectSysProgressInstanceList(sysProgressInstance);
        ExcelUtil<SysProgressInstance> util = new ExcelUtil<SysProgressInstance>(SysProgressInstance.class);
        util.exportExcel(response, list, "审批实例数据");
    }

    /**
     * 获取审批实例详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:instance:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysProgressInstanceService.selectSysProgressInstanceById(id));
    }

    /**
     * 新增审批实例
     */
    @PreAuthorize("@ss.hasPermi('system:instance:add')")
    @Log(title = "审批实例", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysProgressInstance sysProgressInstance)
    {
        return toAjax(sysProgressInstanceService.insertSysProgressInstance(sysProgressInstance));
    }

    /**
     * 修改审批实例
     */
    @PreAuthorize("@ss.hasPermi('system:instance:edit')")
    @Log(title = "审批实例", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysProgressInstance sysProgressInstance)
    {
        return toAjax(sysProgressInstanceService.updateSysProgressInstance(sysProgressInstance));
    }

    /**
     * 删除审批实例
     */
    @PreAuthorize("@ss.hasPermi('system:instance:remove')")
    @Log(title = "审批实例", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysProgressInstanceService.deleteSysProgressInstanceByIds(ids));
    }
}
