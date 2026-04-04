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
 *  com.ruoyi.system.domain.MallClassify
 *  com.ruoyi.system.service.IMallClassifyService
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
import com.ruoyi.system.domain.MallClassify;
import com.ruoyi.system.service.IMallClassifyService;
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
@RequestMapping(value={"/system/classify"})
public class MallClassifyController
extends BaseController {
    @Autowired
    private IMallClassifyService mallClassifyService;

    @PreAuthorize(value="@ss.hasPermi('system:classify:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(MallClassify mallClassify) {
        this.startPage();
        List list = this.mallClassifyService.selectMallClassifyList(mallClassify);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:classify:export')")
    @Log(title="\u5546\u54c1\u5206\u7c7b", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, MallClassify mallClassify) {
        List list = this.mallClassifyService.selectMallClassifyList(mallClassify);
        ExcelUtil util = new ExcelUtil(MallClassify.class);
        util.exportExcel(response, list, "\u5546\u54c1\u5206\u7c7b\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:classify:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.mallClassifyService.selectMallClassifyById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:classify:add')")
    @Log(title="\u5546\u54c1\u5206\u7c7b", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody MallClassify mallClassify) {
        return this.toAjax(this.mallClassifyService.insertMallClassify(mallClassify));
    }

    @PreAuthorize(value="@ss.hasPermi('system:classify:edit')")
    @Log(title="\u5546\u54c1\u5206\u7c7b", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody MallClassify mallClassify) {
        return this.toAjax(this.mallClassifyService.updateMallClassify(mallClassify));
    }

    @PreAuthorize(value="@ss.hasPermi('system:classify:remove')")
    @Log(title="\u5546\u54c1\u5206\u7c7b", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.mallClassifyService.deleteMallClassifyByIds(ids));
    }
}
