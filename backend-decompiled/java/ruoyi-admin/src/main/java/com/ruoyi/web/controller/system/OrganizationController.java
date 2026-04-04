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
 *  com.ruoyi.system.domain.Organization
 *  com.ruoyi.system.service.IOrganizationService
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
import com.ruoyi.system.domain.Organization;
import com.ruoyi.system.service.IOrganizationService;
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
@RequestMapping(value={"/system/organization"})
public class OrganizationController
extends BaseController {
    @Autowired
    private IOrganizationService organizationService;

    @PreAuthorize(value="@ss.hasPermi('system:organization:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(Organization organization) {
        this.startPage();
        List list = this.organizationService.selectOrganizationList(organization);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:organization:export')")
    @Log(title="\u7ec4\u7ec7", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, Organization organization) {
        List list = this.organizationService.selectOrganizationList(organization);
        ExcelUtil util = new ExcelUtil(Organization.class);
        util.exportExcel(response, list, "\u7ec4\u7ec7\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:organization:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.organizationService.selectOrganizationById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:organization:add')")
    @Log(title="\u7ec4\u7ec7", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody Organization organization) {
        return this.toAjax(this.organizationService.insertOrganization(organization));
    }

    @PreAuthorize(value="@ss.hasPermi('system:organization:edit')")
    @Log(title="\u7ec4\u7ec7", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody Organization organization) {
        return this.toAjax(this.organizationService.updateOrganization(organization));
    }

    @PreAuthorize(value="@ss.hasPermi('system:organization:remove')")
    @Log(title="\u7ec4\u7ec7", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.organizationService.deleteOrganizationByIds(ids));
    }
}
