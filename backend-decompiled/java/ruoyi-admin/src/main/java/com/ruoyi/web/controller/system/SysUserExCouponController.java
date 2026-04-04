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
 *  com.ruoyi.system.domain.SysUserExCoupon
 *  com.ruoyi.system.service.ISysCouponService
 *  com.ruoyi.system.service.ISysUserExCouponService
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
import com.ruoyi.system.domain.SysUserExCoupon;
import com.ruoyi.system.service.ISysCouponService;
import com.ruoyi.system.service.ISysUserExCouponService;
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
@RequestMapping(value={"/system/userExCoupon"})
public class SysUserExCouponController
extends BaseController {
    @Autowired
    private ISysUserExCouponService sysUserExCouponService;
    @Autowired
    private ISysCouponService sysCouponService;

    @PreAuthorize(value="@ss.hasPermi('system:coupon:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysUserExCoupon sysUserExCoupon) {
        this.startPage();
        List list = this.sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:export')")
    @Log(title="\u7528\u6237\u5173\u8054\u4f18\u60e0\u5238", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysUserExCoupon sysUserExCoupon) {
        List list = this.sysUserExCouponService.selectSysUserExCouponList(sysUserExCoupon);
        ExcelUtil util = new ExcelUtil(SysUserExCoupon.class);
        util.exportExcel(response, list, "\u7528\u6237\u5173\u8054\u4f18\u60e0\u5238\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.sysUserExCouponService.selectSysUserExCouponById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:add')")
    @Log(title="\u7528\u6237\u5173\u8054\u4f18\u60e0\u5238", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysUserExCoupon sysUserExCoupon) {
        return this.toAjax(this.sysUserExCouponService.insertSysUserExCoupon(sysUserExCoupon));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:edit')")
    @Log(title="\u7528\u6237\u5173\u8054\u4f18\u60e0\u5238", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysUserExCoupon sysUserExCoupon) {
        return this.toAjax(this.sysUserExCouponService.updateSysUserExCoupon(sysUserExCoupon));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:remove')")
    @Log(title="\u7528\u6237\u5173\u8054\u4f18\u60e0\u5238", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysUserExCouponService.deleteSysUserExCouponByIds(ids));
    }

    @PreAuthorize(value="@ss.hasPermi('system:coupon:add')")
    @Log(title="\u7ba1\u7406\u7aef\u53d1\u653e\u4f18\u60e0\u5238", businessType=BusinessType.INSERT)
    @PostMapping(value={"/issueCoupons"})
    public AjaxResult issueCoupons(@RequestBody SysUserExCoupon sysUserExCoupon) {
        AjaxResult ajaxResult = null;
        int count = this.sysUserExCouponService.issueCoupons(sysUserExCoupon, sysUserExCoupon.getPhonenumber());
        if (count > 0) {
            ajaxResult = AjaxResult.success();
        } else if (count == -1) {
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u53d1\u5238\u5931\u8d25\uff1a\u5238\u5e93\u5b58\u4e0d\u8db3");
        } else if (count == 0) {
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u53d1\u5238\u5931\u8d25");
        } else if (count == -2) {
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u53d1\u5238\u5931\u8d25\uff1a\u4e0d\u5b58\u5728\u5f53\u524d\u624b\u673a\u53f7\u7684\u7528\u6237");
        }
        return ajaxResult;
    }
}
