/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.system.service.ISysDeptService
 *  org.apache.commons.lang3.ArrayUtils
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
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.service.ISysDeptService;
import java.util.List;
import org.apache.commons.lang3.ArrayUtils;
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
@RequestMapping(value={"/system/dept"})
public class SysDeptController
extends BaseController {
    @Autowired
    private ISysDeptService deptService;

    @PreAuthorize(value="@ss.hasPermi('system:dept:list')")
    @GetMapping(value={"/list"})
    public AjaxResult list(SysDept dept) {
        List depts = this.deptService.selectDeptList(dept);
        return this.success(depts);
    }

    @GetMapping(value={"/schoolList"})
    public AjaxResult schoolList(SysDept dept) {
        List depts = this.deptService.selectTopDeptList(dept);
        return this.success(depts);
    }

    @PreAuthorize(value="@ss.hasPermi('system:dept:list')")
    @GetMapping(value={"/list/exclude/{deptId}"})
    public AjaxResult excludeChild(@PathVariable(value="deptId", required=false) Long deptId) {
        List depts = this.deptService.selectDeptList(new SysDept());
        depts.removeIf(d -> (long)d.getDeptId().intValue() == deptId || ArrayUtils.contains((Object[])StringUtils.split((String)d.getAncestors(), (String)","), (Object)("" + deptId)));
        return this.success(depts);
    }

    @PreAuthorize(value="@ss.hasPermi('system:dept:query')")
    @GetMapping(value={"/{deptId}"})
    public AjaxResult getInfo(@PathVariable Long deptId) {
        this.deptService.checkDeptDataScope(deptId);
        return this.success(this.deptService.selectDeptById(deptId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:dept:add')")
    @Log(title="\u90e8\u95e8\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysDept dept) {
        if (!this.deptService.checkDeptNameUnique(dept)) {
            return this.error("\u65b0\u589e'" + dept.getDeptName() + "'\u5931\u8d25\uff0c\u540d\u79f0\u5df2\u5b58\u5728");
        }
        dept.setCreateBy(this.getUsername());
        return this.toAjax(this.deptService.insertDept(dept));
    }

    @PreAuthorize(value="@ss.hasPermi('system:dept:edit')")
    @Log(title="\u90e8\u95e8\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysDept dept) {
        Long deptId = dept.getDeptId();
        this.deptService.checkDeptDataScope(deptId);
        if (!this.deptService.checkDeptNameUnique(dept)) {
            return this.error("\u4fee\u6539'" + dept.getDeptName() + "'\u5931\u8d25\uff0c\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if (dept.getParentId().equals(deptId)) {
            return this.error("\u4fee\u6539'" + dept.getDeptName() + "'\u5931\u8d25\uff0c\u4e0a\u7ea7\u4e0d\u80fd\u662f\u81ea\u5df1");
        }
        if (StringUtils.equals((CharSequence)"1", (CharSequence)dept.getStatus()) && this.deptService.selectNormalChildrenDeptById(deptId) > 0) {
            return this.error("\u8be5\u90e8\u95e8\u5305\u542b\u672a\u505c\u7528\u7684\u5b50\u90e8\u95e8\uff01");
        }
        dept.setUpdateBy(this.getUsername());
        return this.toAjax(this.deptService.updateDept(dept));
    }

    @PreAuthorize(value="@ss.hasPermi('system:dept:remove')")
    @Log(title="\u90e8\u95e8\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{deptId}"})
    public AjaxResult remove(@PathVariable Long deptId) {
        if (this.deptService.hasChildByDeptId(deptId)) {
            return this.warn("\u5b58\u5728\u4e0b\u7ea7\u90e8\u95e8,\u4e0d\u5141\u8bb8\u5220\u9664");
        }
        if (this.deptService.checkDeptExistUser(deptId)) {
            return this.warn("\u90e8\u95e8\u5b58\u5728\u7528\u6237,\u4e0d\u5141\u8bb8\u5220\u9664");
        }
        this.deptService.checkDeptDataScope(deptId);
        return this.toAjax(this.deptService.deleteDeptById(deptId));
    }
}
