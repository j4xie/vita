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
 *  com.ruoyi.system.domain.CouponVerifyLog
 *  com.ruoyi.system.service.ICouponVerifyLogService
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
import com.ruoyi.system.domain.CouponVerifyLog;
import com.ruoyi.system.service.ICouponVerifyLogService;
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
@RequestMapping(value={"/system/couponVerifyLog"})
public class CouponVerifyLogController
extends BaseController {
    @Autowired
    private ICouponVerifyLogService couponVerifyLogService;

    @PreAuthorize(value="@ss.hasPermi('system:couponVerifyLog:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(CouponVerifyLog couponVerifyLog) {
        this.startPage();
        List list = this.couponVerifyLogService.selectCouponVerifyLogList(couponVerifyLog);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:couponVerifyLog:export')")
    @Log(title="\u5238\u6838\u9500\u8bb0\u5f55", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, CouponVerifyLog couponVerifyLog) {
        List list = this.couponVerifyLogService.selectCouponVerifyLogList(couponVerifyLog);
        ExcelUtil util = new ExcelUtil(CouponVerifyLog.class);
        util.exportExcel(response, list, "\u5238\u6838\u9500\u8bb0\u5f55\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:couponVerifyLog:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.couponVerifyLogService.selectCouponVerifyLogById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:couponVerifyLog:add')")
    @Log(title="\u5238\u6838\u9500\u8bb0\u5f55", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody CouponVerifyLog couponVerifyLog) {
        return this.toAjax(this.couponVerifyLogService.insertCouponVerifyLog(couponVerifyLog));
    }

    @PreAuthorize(value="@ss.hasPermi('system:couponVerifyLog:edit')")
    @Log(title="\u5238\u6838\u9500\u8bb0\u5f55", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody CouponVerifyLog couponVerifyLog) {
        return this.toAjax(this.couponVerifyLogService.updateCouponVerifyLog(couponVerifyLog));
    }

    @PreAuthorize(value="@ss.hasPermi('system:couponVerifyLog:remove')")
    @Log(title="\u5238\u6838\u9500\u8bb0\u5f55", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.couponVerifyLogService.deleteCouponVerifyLogByIds(ids));
    }
}
