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
 *  com.ruoyi.system.domain.PlateformData
 *  com.ruoyi.system.service.IPlateformDataService
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
import com.ruoyi.system.domain.PlateformData;
import com.ruoyi.system.service.IPlateformDataService;
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
@RequestMapping(value={"/system/data"})
public class PlateformDataController
extends BaseController {
    @Autowired
    private IPlateformDataService plateformDataService;

    @PreAuthorize(value="@ss.hasPermi('system:data:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(PlateformData plateformData) {
        this.startPage();
        List list = this.plateformDataService.selectPlateformDataList(plateformData);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:data:export')")
    @Log(title="\u5e73\u53f0\u8bbe\u7f6e", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, PlateformData plateformData) {
        List list = this.plateformDataService.selectPlateformDataList(plateformData);
        ExcelUtil util = new ExcelUtil(PlateformData.class);
        util.exportExcel(response, list, "\u5e73\u53f0\u8bbe\u7f6e\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:data:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.plateformDataService.selectPlateformDataById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:data:add')")
    @Log(title="\u5e73\u53f0\u8bbe\u7f6e", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody PlateformData plateformData) {
        return this.toAjax(this.plateformDataService.insertPlateformData(plateformData));
    }

    @PreAuthorize(value="@ss.hasPermi('system:data:edit')")
    @Log(title="\u5e73\u53f0\u8bbe\u7f6e", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody PlateformData plateformData) {
        return this.toAjax(this.plateformDataService.updatePlateformData(plateformData));
    }

    @PreAuthorize(value="@ss.hasPermi('system:data:remove')")
    @Log(title="\u5e73\u53f0\u8bbe\u7f6e", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.plateformDataService.deletePlateformDataByIds(ids));
    }
}
