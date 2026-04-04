/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.domain.model.LoginUser
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.framework.web.service.SysPermissionService
 *  com.ruoyi.framework.web.service.TokenService
 *  com.ruoyi.system.domain.SysUserRole
 *  com.ruoyi.system.service.ISysDeptService
 *  com.ruoyi.system.service.ISysRoleService
 *  com.ruoyi.system.service.ISysUserService
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
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.framework.web.service.SysPermissionService;
import com.ruoyi.framework.web.service.TokenService;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.service.ISysDeptService;
import com.ruoyi.system.service.ISysRoleService;
import com.ruoyi.system.service.ISysUserService;
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
@RequestMapping(value={"/system/role"})
public class SysRoleController
extends BaseController {
    @Autowired
    private ISysRoleService roleService;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private SysPermissionService permissionService;
    @Autowired
    private ISysUserService userService;
    @Autowired
    private ISysDeptService deptService;

    @PreAuthorize(value="@ss.hasPermi('system:role:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysRole role) {
        this.startPage();
        List list = this.roleService.selectRoleList(role);
        return this.getDataTable(list);
    }

    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.EXPORT)
    @PreAuthorize(value="@ss.hasPermi('system:role:export')")
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysRole role) {
        List list = this.roleService.selectRoleList(role);
        ExcelUtil util = new ExcelUtil(SysRole.class);
        util.exportExcel(response, list, "\u89d2\u8272\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:query')")
    @GetMapping(value={"/{roleId}"})
    public AjaxResult getInfo(@PathVariable Long roleId) {
        this.roleService.checkRoleDataScope(new Long[]{roleId});
        return this.success(this.roleService.selectRoleById(roleId));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:add')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysRole role) {
        if (!this.roleService.checkRoleNameUnique(role)) {
            return this.error("\u65b0\u589e\u89d2\u8272'" + role.getRoleName() + "'\u5931\u8d25\uff0c\u89d2\u8272\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if (!this.roleService.checkRoleKeyUnique(role)) {
            return this.error("\u65b0\u589e\u89d2\u8272'" + role.getRoleName() + "'\u5931\u8d25\uff0c\u89d2\u8272\u6743\u9650\u5df2\u5b58\u5728");
        }
        role.setCreateBy(this.getUsername());
        return this.toAjax(this.roleService.insertRole(role));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:edit')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysRole role) {
        this.roleService.checkRoleAllowed(role);
        this.roleService.checkRoleDataScope(new Long[]{role.getRoleId()});
        if (!this.roleService.checkRoleNameUnique(role)) {
            return this.error("\u4fee\u6539\u89d2\u8272'" + role.getRoleName() + "'\u5931\u8d25\uff0c\u89d2\u8272\u540d\u79f0\u5df2\u5b58\u5728");
        }
        if (!this.roleService.checkRoleKeyUnique(role)) {
            return this.error("\u4fee\u6539\u89d2\u8272'" + role.getRoleName() + "'\u5931\u8d25\uff0c\u89d2\u8272\u6743\u9650\u5df2\u5b58\u5728");
        }
        role.setUpdateBy(this.getUsername());
        if (this.roleService.updateRole(role) > 0) {
            LoginUser loginUser = this.getLoginUser();
            if (StringUtils.isNotNull((Object)loginUser.getUser()) && !loginUser.getUser().isAdmin()) {
                loginUser.setUser(this.userService.selectUserByUserName(loginUser.getUser().getUserName()));
                loginUser.setPermissions(this.permissionService.getMenuPermission(loginUser.getUser()));
                this.tokenService.setLoginUser(loginUser);
            }
            return this.success();
        }
        return this.error("\u4fee\u6539\u89d2\u8272'" + role.getRoleName() + "'\u5931\u8d25\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458");
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:edit')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping(value={"/dataScope"})
    public AjaxResult dataScope(@RequestBody SysRole role) {
        this.roleService.checkRoleAllowed(role);
        this.roleService.checkRoleDataScope(new Long[]{role.getRoleId()});
        return this.toAjax(this.roleService.authDataScope(role));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:edit')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping(value={"/changeStatus"})
    public AjaxResult changeStatus(@RequestBody SysRole role) {
        this.roleService.checkRoleAllowed(role);
        this.roleService.checkRoleDataScope(new Long[]{role.getRoleId()});
        role.setUpdateBy(this.getUsername());
        return this.toAjax(this.roleService.updateRoleStatus(role));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:remove')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{roleIds}"})
    public AjaxResult remove(@PathVariable Long[] roleIds) {
        return this.toAjax(this.roleService.deleteRoleByIds(roleIds));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:query')")
    @GetMapping(value={"/optionselect"})
    public AjaxResult optionselect() {
        return this.success(this.roleService.selectRoleAll());
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:list')")
    @GetMapping(value={"/authUser/allocatedList"})
    public TableDataInfo allocatedList(SysUser user) {
        this.startPage();
        List list = this.userService.selectAllocatedList(user);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:list')")
    @GetMapping(value={"/authUser/unallocatedList"})
    public TableDataInfo unallocatedList(SysUser user) {
        this.startPage();
        List list = this.userService.selectUnallocatedList(user);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:query')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.GRANT)
    @PutMapping(value={"/authUser/cancel"})
    public AjaxResult cancelAuthUser(@RequestBody SysUserRole userRole) {
        return this.toAjax(this.roleService.deleteAuthUser(userRole));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:query')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.GRANT)
    @PutMapping(value={"/authUser/cancelAll"})
    public AjaxResult cancelAuthUserAll(Long roleId, Long[] userIds) {
        return this.toAjax(this.roleService.deleteAuthUsers(roleId, userIds));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:query')")
    @Log(title="\u89d2\u8272\u7ba1\u7406", businessType=BusinessType.GRANT)
    @PutMapping(value={"/authUser/selectAll"})
    public AjaxResult selectAuthUserAll(Long roleId, Long[] userIds) {
        this.roleService.checkRoleDataScope(new Long[]{roleId});
        return this.toAjax(this.roleService.insertAuthUsers(roleId, userIds));
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:query')")
    @GetMapping(value={"/deptTree/{roleId}"})
    public AjaxResult deptTree(@PathVariable(value="roleId") Long roleId) {
        AjaxResult ajax = AjaxResult.success();
        ajax.put("checkedKeys", (Object)this.deptService.selectDeptListByRoleId(roleId));
        ajax.put("depts", (Object)this.deptService.selectDeptTreeList(new SysDept()));
        return ajax;
    }
}
