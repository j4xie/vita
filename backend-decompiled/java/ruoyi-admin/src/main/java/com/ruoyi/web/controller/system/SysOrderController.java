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
 *  com.ruoyi.system.domain.SysOrder
 *  com.ruoyi.system.service.ISysOrderService
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
import com.ruoyi.system.domain.SysOrder;
import com.ruoyi.system.service.ISysOrderService;
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
@RequestMapping(value={"/system/order"})
public class SysOrderController
extends BaseController {
    @Autowired
    private ISysOrderService sysOrderService;

    @PreAuthorize(value="@ss.hasPermi('system:order:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysOrder sysOrder) {
        this.startPage();
        List list = this.sysOrderService.selectSysOrderList(sysOrder);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:order:export')")
    @Log(title="\u8ba2\u5355", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysOrder sysOrder) {
        List list = this.sysOrderService.selectSysOrderList(sysOrder);
        ExcelUtil util = new ExcelUtil(SysOrder.class);
        util.exportExcel(response, list, "\u8ba2\u5355\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:order:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.sysOrderService.selectSysOrderById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:order:add')")
    @Log(title="\u8ba2\u5355", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysOrder sysOrder) {
        return this.toAjax(this.sysOrderService.insertSysOrder(sysOrder));
    }

    @PreAuthorize(value="@ss.hasPermi('system:order:edit')")
    @Log(title="\u8ba2\u5355", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysOrder sysOrder) {
        return this.toAjax(this.sysOrderService.updateSysOrder(sysOrder));
    }

    @PreAuthorize(value="@ss.hasPermi('system:order:remove')")
    @Log(title="\u8ba2\u5355", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.sysOrderService.deleteSysOrderByIds(ids));
    }

    @PreAuthorize(value="@ss.hasPermi('system:order:list')")
    @Log(title="\u8ba2\u5355\u53d1\u8d27", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/sendOrder"})
    public AjaxResult sendOrder(@RequestBody SysOrder sysOrder) {
        sysOrder.setOrderStatus(Long.valueOf(6L));
        return this.toAjax(this.sysOrderService.updateSysOrder(sysOrder));
    }
}
