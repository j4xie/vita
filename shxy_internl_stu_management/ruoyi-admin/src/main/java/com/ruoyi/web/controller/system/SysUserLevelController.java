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
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.service.ISysUserLevelService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 会员等级Controller
 * 
 * @author ruoyi
 * @date 2025-09-19
 */
@RestController
@RequestMapping("/system/level")
public class SysUserLevelController extends BaseController
{
    @Autowired
    private ISysUserLevelService sysUserLevelService;

    /**
     * 查询会员等级列表
     */
    @PreAuthorize("@ss.hasPermi('system:level:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysUserLevel sysUserLevel)
    {
        startPage();
        List<SysUserLevel> list = sysUserLevelService.selectSysUserLevelList(sysUserLevel);
        return getDataTable(list);
    }

    /**
     * 导出会员等级列表
     */
    @PreAuthorize("@ss.hasPermi('system:level:export')")
    @Log(title = "会员等级", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysUserLevel sysUserLevel)
    {
        List<SysUserLevel> list = sysUserLevelService.selectSysUserLevelList(sysUserLevel);
        ExcelUtil<SysUserLevel> util = new ExcelUtil<SysUserLevel>(SysUserLevel.class);
        util.exportExcel(response, list, "会员等级数据");
    }

    /**
     * 获取会员等级详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:level:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysUserLevelService.selectSysUserLevelById(id));
    }

    /**
     * 新增会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:level:add')")
    @Log(title = "会员等级", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysUserLevel sysUserLevel)
    {
        sysUserLevel.setCreateByUserId(getUserId());
        sysUserLevel.setCreateByName(getLoginUser().getUser().getLegalName());
        return toAjax(sysUserLevelService.insertSysUserLevel(sysUserLevel));
    }

    /**
     * 修改会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:level:edit')")
    @Log(title = "会员等级", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysUserLevel sysUserLevel)
    {
        sysUserLevel.setUpdateByName(getLoginUser().getUser().getLegalName());
        return toAjax(sysUserLevelService.updateSysUserLevel(sysUserLevel));
    }

    /**
     * 删除会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:level:remove')")
    @Log(title = "会员等级", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysUserLevelService.deleteSysUserLevelByIds(ids));
    }

}
