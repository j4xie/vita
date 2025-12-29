package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysUserAddress;
import com.ruoyi.system.service.ISysUserAddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 收货地址Controller
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
@RestController
@RequestMapping("/app/address")
public class AppUserAddressController extends BaseController
{
    @Autowired
    private ISysUserAddressService sysUserAddressService;

    /**
     * 查询收货地址列表
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping("/list")
    public TableDataInfo list(SysUserAddress sysUserAddress)
    {
        startPage();
        sysUserAddress.setCreateById(getUserId());
        List<SysUserAddress> list = sysUserAddressService.selectSysUserAddressList(sysUserAddress);
        return getDataTable(list);
    }

    /**
     * 获取收货地址详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(Long id)
    {
        return success(sysUserAddressService.selectSysUserAddressById(id));
    }

    /**
     * 新增收货地址
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Log(title = "收货地址", businessType = BusinessType.INSERT)
    @PostMapping("/add")
    public AjaxResult add(SysUserAddress sysUserAddress)
    {
        sysUserAddress.setCreateById(getUserId());
        sysUserAddress.setCreateByName(getLoginUser().getUser().getLegalName());
        return toAjax(sysUserAddressService.insertSysUserAddress(sysUserAddress));
    }

    /**
     * 修改收货地址
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Log(title = "收货地址", businessType = BusinessType.UPDATE)
    @PostMapping("/edit")
    public AjaxResult edit(SysUserAddress sysUserAddress)
    {
        sysUserAddress.setCreateById(getUserId());
        sysUserAddress.setCreateByName(getLoginUser().getUser().getLegalName());
        return toAjax(sysUserAddressService.updateSysUserAddress(sysUserAddress));
    }

    /**
     * 删除收货地址
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @Log(title = "收货地址", businessType = BusinessType.DELETE)
	@GetMapping("/delete")
    public AjaxResult remove(Long id)
    {
        return toAjax(sysUserAddressService.deleteSysUserAddressById(id));
    }
}
