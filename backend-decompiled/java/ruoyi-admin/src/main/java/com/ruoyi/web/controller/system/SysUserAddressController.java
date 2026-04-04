/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.SysUserAddress
 *  com.ruoyi.system.service.ISysUserAddressService
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.web.bind.annotation.DeleteMapping
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PathVariable
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.PutMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysUserAddress;
import com.ruoyi.system.service.ISysUserAddressService;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/system/address"})
public class SysUserAddressController
extends BaseController {
    @Autowired
    private ISysUserAddressService sysUserAddressService;

    @PreAuthorize(value="@ss.hasPermi('system:address:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysUserAddress sysUserAddress) {
        this.startPage();
        List list = this.sysUserAddressService.selectSysUserAddressList(sysUserAddress);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:address:export')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysUserAddress sysUserAddress) {
        List list = this.sysUserAddressService.selectSysUserAddressList(sysUserAddress);
        ExcelUtil util = new ExcelUtil(SysUserAddress.class);
        util.exportExcel(response, list, "\u6536\u8d27\u5730\u5740\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:address:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.sysUserAddressService.selectSysUserAddressById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:address:add')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysUserAddress sysUserAddress) {
        return this.toAjax(this.sysUserAddressService.insertSysUserAddress(sysUserAddress));
    }

    @PreAuthorize(value="@ss.hasPermi('system:address:edit')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysUserAddress sysUserAddress) {
        return this.toAjax(this.sysUserAddressService.updateSysUserAddress(sysUserAddress));
    }

    @PreAuthorize(value="@ss.hasPermi('system:address:remove')")
    @Log(title="\u6536\u8d27\u5730\u5740", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysUserAddressService.deleteSysUserAddressByIds(ids));
    }
}
