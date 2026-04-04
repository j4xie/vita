/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.system.domain.SysUserAddress
 *  com.ruoyi.system.service.ISysUserAddressService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.SysUserAddress;
import com.ruoyi.system.service.ISysUserAddressService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/address"})
public class AppUserAddressController
extends BaseController {
    @Autowired
    private ISysUserAddressService sysUserAddressService;

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysUserAddress sysUserAddress) {
        this.startPage();
        sysUserAddress.setCreateById(this.getUserId());
        List list = this.sysUserAddressService.selectSysUserAddressList(sysUserAddress);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(Long id) {
        return this.success(this.sysUserAddressService.selectSysUserAddressById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.INSERT)
    @PostMapping(value={"/add"})
    public AjaxResult add(SysUserAddress sysUserAddress) {
        sysUserAddress.setCreateById(this.getUserId());
        sysUserAddress.setCreateByName(this.getLoginUser().getUser().getLegalName());
        return this.toAjax(this.sysUserAddressService.insertSysUserAddress(sysUserAddress));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/edit"})
    public AjaxResult edit(SysUserAddress sysUserAddress) {
        sysUserAddress.setCreateById(this.getUserId());
        sysUserAddress.setCreateByName(this.getLoginUser().getUser().getLegalName());
        return this.toAjax(this.sysUserAddressService.updateSysUserAddress(sysUserAddress));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.DELETE)
    @GetMapping(value={"/delete"})
    public AjaxResult remove(Long id) {
        return this.toAjax(this.sysUserAddressService.deleteSysUserAddressById(id));
    }
}
