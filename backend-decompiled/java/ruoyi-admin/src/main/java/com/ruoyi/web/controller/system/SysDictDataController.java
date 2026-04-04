/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysDictData
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.service.ISysDictDataService
 *  com.ruoyi.system.service.ISysDictTypeService
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.validation.annotation.Validated
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
import com.ruoyi.common.core.domain.entity.SysDictData;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.service.ISysDictDataService;
import com.ruoyi.system.service.ISysDictTypeService;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/system/dict/data"})
public class SysDictDataController
extends BaseController {
    @Autowired
    private ISysDictDataService dictDataService;
    @Autowired
    private ISysDictTypeService dictTypeService;

    @PreAuthorize(value="@ss.hasPermi('system:dict:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysDictData dictData) {
        this.startPage();
        List list = this.dictDataService.selectDictDataList(dictData);
        return this.getDataTable(list);
    }

    @Log(title="\u5b57\u5178\u6570\u636e", businessType=BusinessType.EXPORT)
    @PreAuthorize(value="@ss.hasPermi('system:dict:export')")
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysDictData dictData) {
        List list = this.dictDataService.selectDictDataList(dictData);
        ExcelUtil util = new ExcelUtil(SysDictData.class);
        util.exportExcel(response, list, "\u5b57\u5178\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:dict:query')")
    @GetMapping(value={"/{dictCode}"})
    public AjaxResult getInfo(@PathVariable Long dictCode) {
        return this.success(this.dictDataService.selectDictDataById(dictCode));
    }

    @GetMapping(value={"/type/{dictType}"})
    public AjaxResult dictType(@PathVariable String dictType) {
        ArrayList data = this.dictTypeService.selectDictDataByType(dictType);
        if (StringUtils.isNull((Object)data)) {
            data = new ArrayList();
        }
        return this.success(data);
    }

    @PreAuthorize(value="@ss.hasPermi('system:dict:add')")
    @Log(title="\u5b57\u5178\u6570\u636e", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysDictData dict) {
        dict.setCreateBy(this.getUsername());
        return this.toAjax(this.dictDataService.insertDictData(dict));
    }

    @PreAuthorize(value="@ss.hasPermi('system:dict:edit')")
    @Log(title="\u5b57\u5178\u6570\u636e", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysDictData dict) {
        dict.setUpdateBy(this.getUsername());
        return this.toAjax(this.dictDataService.updateDictData(dict));
    }

    @PreAuthorize(value="@ss.hasPermi('system:dict:remove')")
    @Log(title="\u5b57\u5178\u7c7b\u578b", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{dictCodes}"})
    public AjaxResult remove(@PathVariable Long[] dictCodes) {
        this.dictDataService.deleteDictDataByIds(dictCodes);
        return this.success();
    }
}
