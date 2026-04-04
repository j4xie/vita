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
 *  com.ruoyi.system.domain.EquityData
 *  com.ruoyi.system.service.IEquityDataService
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
import com.ruoyi.system.domain.EquityData;
import com.ruoyi.system.service.IEquityDataService;
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
@RequestMapping(value={"/system/equData"})
public class EquityDataController
extends BaseController {
    @Autowired
    private IEquityDataService equityDataService;

    @PreAuthorize(value="@ss.hasPermi('system:equData:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(EquityData equityData) {
        this.startPage();
        List list = this.equityDataService.selectEquityDataList(equityData);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:equData:export')")
    @Log(title="\u6838\u5fc3\u6743\u76ca\u7ba1\u7406", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, EquityData equityData) {
        List list = this.equityDataService.selectEquityDataList(equityData);
        ExcelUtil util = new ExcelUtil(EquityData.class);
        util.exportExcel(response, list, "\u6838\u5fc3\u6743\u76ca\u7ba1\u7406\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:equData:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.equityDataService.selectEquityDataById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:equData:add')")
    @Log(title="\u6838\u5fc3\u6743\u76ca\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody EquityData equityData) {
        EquityData equityDataVo = this.equityDataService.selectEquityDataByTag(equityData.getEquTag());
        if (null != equityDataVo) {
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u6743\u76ca\u6807\u8bc6\u5df2\u5b58\u5728\uff0c\u4e0d\u80fd\u91cd\u590d");
            return ajaxResult;
        }
        return this.toAjax(this.equityDataService.insertEquityData(equityData));
    }

    @PreAuthorize(value="@ss.hasPermi('system:equData:edit')")
    @Log(title="\u6838\u5fc3\u6743\u76ca\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody EquityData equityData) {
        EquityData equityDataVo = this.equityDataService.selectEquityDataByTag(equityData.getEquTag());
        if (null != equityDataVo && !equityData.getId().equals(equityDataVo.getId())) {
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u6743\u76ca\u6807\u8bc6\u5df2\u5b58\u5728\uff0c\u4e0d\u80fd\u91cd\u590d");
            return ajaxResult;
        }
        return this.toAjax(this.equityDataService.updateEquityData(equityData));
    }

    @PreAuthorize(value="@ss.hasPermi('system:equData:remove')")
    @Log(title="\u6838\u5fc3\u6743\u76ca\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.equityDataService.deleteEquityDataByIds(ids));
    }
}
