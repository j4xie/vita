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
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 用户对应会员等级Controller
 * 
 * @author ruoyi
 * @date 2025-09-21
 */
@RestController
@RequestMapping("/system/userExLevel")
public class SysUserExLevelController extends BaseController
{
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;

    /**
     * 查询用户对应会员等级列表
     */
    @PreAuthorize("@ss.hasPermi('system:level:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysUserExLevel sysUserExLevel)
    {
        startPage();
        List<SysUserExLevel> list = sysUserExLevelService.selectSysUserExLevelList(sysUserExLevel);
        return getDataTable(list);
    }

    /**
     * 导出用户对应会员等级列表
     */
    @PreAuthorize("@ss.hasPermi('system:level:export')")
    @Log(title = "用户对应会员等级", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysUserExLevel sysUserExLevel)
    {
        List<SysUserExLevel> list = sysUserExLevelService.selectSysUserExLevelList(sysUserExLevel);
        ExcelUtil<SysUserExLevel> util = new ExcelUtil<SysUserExLevel>(SysUserExLevel.class);
        util.exportExcel(response, list, "用户对应会员等级数据");
    }

    /**
     * 获取用户对应会员等级详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:level:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysUserExLevelService.selectSysUserExLevelById(id));
    }

    /**
     * 新增用户对应会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:level:add')")
    @Log(title = "用户对应会员等级", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysUserExLevel sysUserExLevel)
    {
        return toAjax(sysUserExLevelService.insertSysUserExLevel(sysUserExLevel));
    }

    /**
     * 修改用户对应会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:level:edit')")
    @Log(title = "用户对应会员等级", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysUserExLevel sysUserExLevel)
    {
        return toAjax(sysUserExLevelService.updateSysUserExLevel(sysUserExLevel));
    }

    /**
     * 删除用户对应会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:level:remove')")
    @Log(title = "用户对应会员等级", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysUserExLevelService.deleteSysUserExLevelByIds(ids));
    }
}
