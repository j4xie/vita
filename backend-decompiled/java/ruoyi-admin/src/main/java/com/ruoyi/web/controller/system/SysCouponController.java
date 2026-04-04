/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.enums.RoleKey
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.SysCoupon
 *  com.ruoyi.system.domain.UserExMerchant
 *  com.ruoyi.system.service.ISysCouponService
 *  com.ruoyi.system.service.IUserExMerchantService
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
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysCoupon;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.service.ISysCouponService;
import com.ruoyi.system.service.IUserExMerchantService;
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
@RequestMapping(value={"/system/coupon"})
public class SysCouponController
extends BaseController {
    @Autowired
    private ISysCouponService sysCouponService;
    @Autowired
    IUserExMerchantService userExMerchantService;

    @PreAuthorize(value="@ss.hasPermi('system:coupon:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysCoupon sysCoupon) {
        SysRole sysRole = this.getLoginUser().getUser().getRole();
        if (!sysRole.getRoleKey().equals(RoleKey.manage.getValue()) && !sysRole.getRoleKey().equals(RoleKey.admin.getValue())) {
            if (sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())) {
                sysCoupon.setCreateByUserId(this.getUserId());
            } else if (sysRole.getRoleKey().equals(RoleKey.merchant.getValue())) {
                sysCoupon.setCreateByUserId(this.getUserId());
            }
        }
        this.startPage();
        List list = this.sysCouponService.selectSysCouponList(sysCoupon);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:export')")
    @Log(title="\u4f18\u60e0\u5238", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysCoupon sysCoupon) {
        List list = this.sysCouponService.selectSysCouponList(sysCoupon);
        ExcelUtil util = new ExcelUtil(SysCoupon.class);
        util.exportExcel(response, list, "\u4f18\u60e0\u5238\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.sysCouponService.selectSysCouponById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:add')")
    @Log(title="\u4f18\u60e0\u5238", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysCoupon sysCoupon) {
        sysCoupon.setCreateByUserId(this.getUserId());
        SysRole sysRole = this.getLoginUser().getUser().getRole();
        if (sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())) {
            sysCoupon.setStatus(Long.valueOf(1L));
            sysCoupon.setCreateByName(this.getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(Long.valueOf(2L));
        } else if (sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())) {
            sysCoupon.setStatus(Long.valueOf(-1L));
            sysCoupon.setCreateByName(this.getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(Long.valueOf(2L));
        } else if (sysRole.getRoleKey().equals(RoleKey.merchant.getValue())) {
            sysCoupon.setStatus(Long.valueOf(-1L));
            sysCoupon.setSourceFrom(Long.valueOf(1L));
            UserExMerchant userExMerchant = this.userExMerchantService.selectUserExMerchantByUserId(this.getUserId());
            sysCoupon.setPurpose(Long.valueOf(2L));
            sysCoupon.setPurposeMerchantUserId(this.getUserId().toString());
            if (null != userExMerchant) {
                sysCoupon.setCreateByName(userExMerchant.getMerchantName());
            }
        }
        return this.toAjax(this.sysCouponService.insertSysCoupon(sysCoupon));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:edit')")
    @Log(title="\u4f18\u60e0\u5238", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysCoupon sysCoupon) {
        sysCoupon.setCreateByUserId(this.getUserId());
        SysRole sysRole = this.getLoginUser().getUser().getRole();
        if (sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())) {
            sysCoupon.setStatus(Long.valueOf(1L));
            sysCoupon.setCreateByName(this.getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(Long.valueOf(2L));
        } else if (sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())) {
            sysCoupon.setStatus(Long.valueOf(-1L));
            sysCoupon.setCreateByName(this.getLoginUser().getUser().getLegalName());
            sysCoupon.setSourceFrom(Long.valueOf(2L));
        } else if (sysRole.getRoleKey().equals(RoleKey.merchant.getValue())) {
            sysCoupon.setStatus(Long.valueOf(-1L));
            sysCoupon.setSourceFrom(Long.valueOf(1L));
        }
        return this.toAjax(this.sysCouponService.updateSysCoupon(sysCoupon));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:audit')")
    @Log(title="\u4f18\u60e0\u5238", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/audit"})
    public AjaxResult audit(@RequestBody SysCoupon sysCoupon) {
        return this.toAjax(this.sysCouponService.updateSysCoupon(sysCoupon));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:remove')")
    @Log(title="\u4f18\u60e0\u5238", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysCouponService.deleteSysCouponByIds(ids));
    }
}
