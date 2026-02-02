package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.domain.SysUserLevel;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.system.service.ISysUserLevelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 用户对应会员等级Controller
 * 
 * @author ruoyi
 * @date 2025-09-21
 */
@RestController
@RequestMapping("/app/userExLevel")
public class AppUserExLevelController extends BaseController
{
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;

    @Autowired
    private ISysUserLevelService sysUserLevelService;

    /**
     * 获取用户对应会员等级详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping(value = "/info")
    public AjaxResult getInfo(Long userId)
    {
        if(null == userId){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "用户id参数缺失");
            return ajaxResult;
        }
        SysUserExLevel sysUserExLevel = sysUserExLevelService.selectSysUserExLevelByUserId(userId);
        if(null != sysUserExLevel){
            SysUserLevel sysUserLevel = sysUserLevelService.selectSysUserLevelById(sysUserExLevel.getLevelId());
            sysUserExLevel.setSysUserLevel(sysUserLevel);
        }
        return success(sysUserExLevel);
    }

    /**
     * 新增用户对应会员等级
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
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
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Log(title = "用户对应会员等级", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysUserExLevelService.deleteSysUserExLevelByIds(ids));
    }
}
