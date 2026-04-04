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
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.enums.RoleKey
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.SysUserExLevel
 *  com.ruoyi.system.service.ISysDeptService
 *  com.ruoyi.system.service.ISysPostService
 *  com.ruoyi.system.service.ISysRoleService
 *  com.ruoyi.system.service.ISysUserExLevelService
 *  com.ruoyi.system.service.ISysUserService
 *  javax.servlet.http.HttpServletResponse
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
 *  org.springframework.web.multipart.MultipartFile
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.service.ISysDeptService;
import com.ruoyi.system.service.ISysPostService;
import com.ruoyi.system.service.ISysRoleService;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.system.service.ISysUserService;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import javax.servlet.http.HttpServletResponse;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value={"/system/user"})
public class SysUserController
extends BaseController {
    @Autowired
    private ISysUserService userService;
    @Autowired
    private ISysRoleService roleService;
    @Autowired
    private ISysDeptService deptService;
    @Autowired
    private ISysPostService postService;
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;

    @PreAuthorize(value="@ss.hasPermi('system:user:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(SysUser user) {
        this.startPage();
        List list = this.userService.selectUserList(user);
        return this.getDataTable(list);
    }

    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.EXPORT)
    @PreAuthorize(value="@ss.hasPermi('system:user:export')")
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, SysUser user) {
        List list = this.userService.selectUserList(user);
        ExcelUtil util = new ExcelUtil(SysUser.class);
        util.exportExcel(response, list, "\u7528\u6237\u6570\u636e");
    }

    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.IMPORT)
    @PreAuthorize(value="@ss.hasPermi('system:user:import')")
    @PostMapping(value={"/importData"})
    public AjaxResult importData(MultipartFile file, boolean updateSupport) throws Exception {
        ExcelUtil util = new ExcelUtil(SysUser.class);
        List userList = util.importExcel(file.getInputStream());
        String operName = this.getUsername();
        String message = this.userService.importUser(userList, Boolean.valueOf(updateSupport), operName);
        return this.success(message);
    }

    @PostMapping(value={"/importTemplate"})
    public void importTemplate(HttpServletResponse response) {
        ExcelUtil util = new ExcelUtil(SysUser.class);
        util.importTemplateExcel(response, "\u7528\u6237\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:query')")
    @GetMapping(value={"/", "/{userId}"})
    public AjaxResult getInfo(@PathVariable(value="userId", required=false) Long userId) {
        AjaxResult ajax = AjaxResult.success();
        if (StringUtils.isNotNull((Object)userId)) {
            this.userService.checkUserDataScope(userId);
            SysUser sysUser = this.userService.selectUserById(userId);
            ajax.put("data", (Object)sysUser);
            ajax.put("postId", (Object)this.postService.selectPostIdByUserId(userId));
            if (null != sysUser.getRole()) {
                ajax.put("roleId", (Object)sysUser.getRole().getRoleId());
            }
            ajax.put("roleIds", sysUser.getRoles().stream().map(SysRole::getRoleId).collect(Collectors.toList()));
        }
        List roles = this.roleService.selectRoleAll();
        if (SysUser.isAdmin((Long)userId)) {
            ajax.put("roles", (Object)roles);
        } else if (RoleKey.admin.getValue().equals(this.getLoginUser().getUser().getRole().getRoleKey())) {
            ajax.put("roles", (Object)roles);
        } else if (RoleKey.manage.getValue().equals(this.getLoginUser().getUser().getRole().getRoleKey())) {
            ajax.put("roles", (Object)roles);
        } else {
            ArrayList<SysRole> rolesDto = new ArrayList<SysRole>();
            for (int i = 0; i < roles.size(); ++i) {
                if (!RoleKey.staff.getValue().equals(((SysRole)roles.get(i)).getRoleKey()) && !RoleKey.common.getValue().equals(((SysRole)roles.get(i)).getRoleKey())) continue;
                rolesDto.add((SysRole)roles.get(i));
            }
            ajax.put("roles", rolesDto);
        }
        ajax.put("posts", (Object)this.postService.selectPostAll());
        return ajax;
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:add')")
    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysUser user) {
        this.deptService.checkDeptDataScope(user.getDeptId());
        this.roleService.checkRoleDataScope(user.getRoleIds());
        if (!this.userService.checkUserNameUnique(user)) {
            return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u767b\u5f55\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getPhonenumber()) && !this.userService.checkPhoneUnique(user)) {
            return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getEmail()) && !this.userService.checkEmailUnique(user)) {
            return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        user.setCreateBy(this.getUsername());
        user.setPassword(SecurityUtils.encryptPassword((String)user.getPassword()));
        int res = this.userService.insertUser(user);
        SysUserExLevel sysUserExLevel = new SysUserExLevel();
        sysUserExLevel.setUserId(user.getUserId());
        int count = this.sysUserExLevelService.registerSendUserLevel(sysUserExLevel);
        if (count == 0) {
            System.out.println("\u6ce8\u518c\u9001\u4f1a\u5458\u5931\u8d25");
        } else if (count < 0) {
            System.out.println("\u6ce8\u518c\u65e0\u53ef\u9001\u4f1a\u5458");
        } else if (count > 0) {
            System.out.println("\u6ce8\u518c\u9001\u4f1a\u5458\u6210\u529f");
        }
        return this.toAjax(res);
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:edit')")
    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysUser user) {
        this.userService.checkUserAllowed(user);
        this.userService.checkUserDataScope(user.getUserId());
        this.deptService.checkDeptDataScope(user.getDeptId());
        this.roleService.checkRoleDataScope(user.getRoleIds());
        if (!this.userService.checkUserNameUnique(user)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u767b\u5f55\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getPhonenumber()) && !this.userService.checkPhoneUnique(user)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getEmail()) && !this.userService.checkEmailUnique(user)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        user.setUpdateBy(this.getUsername());
        return this.toAjax(this.userService.updateUser(user));
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:remove')")
    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{userIds}"})
    public AjaxResult remove(@PathVariable Long[] userIds) {
        if (ArrayUtils.contains((Object[])userIds, (Object)this.getUserId())) {
            return this.error("\u5f53\u524d\u7528\u6237\u4e0d\u80fd\u5220\u9664");
        }
        return this.toAjax(this.userService.deleteUserByIds(userIds));
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:resetPwd')")
    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping(value={"/resetPwd"})
    public AjaxResult resetPwd(@RequestBody SysUser user) {
        this.userService.checkUserAllowed(user);
        this.userService.checkUserDataScope(user.getUserId());
        user.setPassword(SecurityUtils.encryptPassword((String)user.getPassword()));
        user.setUpdateBy(this.getUsername());
        return this.toAjax(this.userService.resetPwd(user));
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:edit')")
    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PutMapping(value={"/changeStatus"})
    public AjaxResult changeStatus(@RequestBody SysUser user) {
        this.userService.checkUserAllowed(user);
        this.userService.checkUserDataScope(user.getUserId());
        user.setUpdateBy(this.getUsername());
        return this.toAjax(this.userService.updateUserStatus(user));
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:query')")
    @GetMapping(value={"/authRole/{userId}"})
    public AjaxResult authRole(@PathVariable(value="userId") Long userId) {
        AjaxResult ajax = AjaxResult.success();
        SysUser user = this.userService.selectUserById(userId);
        List roles = this.roleService.selectRolesByUserId(userId);
        ajax.put("user", (Object)user);
        ajax.put("roles", (Object)(SysUser.isAdmin((Long)userId) ? roles : roles.stream().filter(r -> !r.isAdmin()).collect(Collectors.toList())));
        return ajax;
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:edit')")
    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.GRANT)
    @PutMapping(value={"/authRole"})
    public AjaxResult insertAuthRole(Long userId, Long[] roleIds) {
        this.userService.checkUserDataScope(userId);
        this.roleService.checkRoleDataScope(roleIds);
        this.userService.insertUserAuth(userId, roleIds);
        return this.success();
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:list')")
    @GetMapping(value={"/deptTree"})
    public AjaxResult deptTree(SysDept dept) {
        return this.success(this.deptService.selectDeptTreeList(dept));
    }
}
