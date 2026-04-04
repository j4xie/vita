/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.enums.RoleKey
 *  com.ruoyi.common.enums.UserStatus
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.poi.ExcelUtil
 *  com.ruoyi.system.domain.UserExMerchant
 *  com.ruoyi.system.domain.UserExMerchantAuditLog
 *  com.ruoyi.system.service.ISysUserService
 *  com.ruoyi.system.service.IUserExMerchantService
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
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.enums.UserStatus;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.IUserExMerchantService;
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
@RequestMapping(value={"/system/merchant"})
public class UserExMerchantController
extends BaseController {
    @Autowired
    private IUserExMerchantService userExMerchantService;
    @Autowired
    ISysUserService iSysUserService;

    @PreAuthorize(value="@ss.hasPermi('system:merchant:list')")
    @GetMapping(value={"/list"})
    public TableDataInfo list(UserExMerchant userExMerchant) {
        SysRole sysRole = this.getLoginUser().getUser().getRole();
        if (!sysRole.getRoleKey().equals(RoleKey.manage.getValue()) && !sysRole.getRoleKey().equals(RoleKey.admin.getValue()) && sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())) {
            userExMerchant.setCreateById(this.getUserId());
        }
        this.startPage();
        List list = this.userExMerchantService.selectUserExMerchantList(userExMerchant);
        return this.getDataTable(list);
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:list')")
    @GetMapping(value={"/allList"})
    public AjaxResult allList(UserExMerchant userExMerchant) {
        AjaxResult ajaxResult = AjaxResult.success();
        SysRole sysRole = this.getLoginUser().getUser().getRole();
        if (!sysRole.getRoleKey().equals(RoleKey.manage.getValue()) && !sysRole.getRoleKey().equals(RoleKey.admin.getValue()) && sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())) {
            userExMerchant.setCreateById(this.getUserId());
        }
        userExMerchant.setStatus(Long.valueOf(3L));
        List list = this.userExMerchantService.selectUserExMerchantList(userExMerchant);
        ajaxResult.put("data", (Object)list);
        return ajaxResult;
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:export')")
    @Log(title="\u5546\u6237", businessType=BusinessType.EXPORT)
    @PostMapping(value={"/export"})
    public void export(HttpServletResponse response, UserExMerchant userExMerchant) {
        List list = this.userExMerchantService.selectUserExMerchantList(userExMerchant);
        ExcelUtil util = new ExcelUtil(UserExMerchant.class);
        util.exportExcel(response, list, "\u5546\u6237\u6570\u636e");
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:query')")
    @GetMapping(value={"/{id}"})
    public AjaxResult getInfo(@PathVariable(value="id") Long id) {
        return this.success(this.userExMerchantService.selectUserExMerchantById(id));
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:add')")
    @Log(title="\u5546\u6237", businessType=BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserExMerchant userExMerchant) {
        SysUser sysUser = new SysUser();
        sysUser.setUserName(userExMerchant.getUserName());
        sysUser.setPassword(SecurityUtils.encryptPassword((String)userExMerchant.getPassword()));
        sysUser.setLegalName(userExMerchant.getLegalName());
        sysUser.setStatus(UserStatus.DISABLE.getCode());
        sysUser.setPhonenumber(userExMerchant.getPhonenumber());
        sysUser.setEmail(userExMerchant.getEmail());
        sysUser.setIsMerchant(1);
        if (!this.iSysUserService.checkUserNameUnique(sysUser)) {
            return this.error("\u767b\u5f55\u8d26\u53f7" + sysUser.getUserName() + "\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)sysUser.getPhonenumber()) && !this.iSysUserService.checkPhoneUnique(sysUser)) {
            return this.error("\u65b0\u589e\u7528\u6237'" + sysUser.getUserName() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)sysUser.getEmail()) && !this.iSysUserService.checkEmailUnique(sysUser)) {
            return this.error("\u65b0\u589e\u7528\u6237'" + sysUser.getUserName() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        int count = this.iSysUserService.insertUser(sysUser);
        if (count <= 0) {
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u521b\u5efa\u5546\u5bb6\u5931\u8d25");
            return ajaxResult;
        }
        userExMerchant.setUserId(sysUser.getUserId());
        userExMerchant.setCreateById(this.getUserId());
        userExMerchant.setCreateByName(this.getLoginUser().getUser().getLegalName());
        return this.toAjax(this.userExMerchantService.insertUserExMerchant(userExMerchant));
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:edit')")
    @Log(title="\u5546\u6237", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserExMerchant userExMerchant) {
        if (null != userExMerchant.getUserId()) {
            SysUser sysUser = new SysUser();
            sysUser.setUserName(userExMerchant.getUserName());
            sysUser.setLegalName(userExMerchant.getLegalName());
            sysUser.setPhonenumber(userExMerchant.getPhonenumber());
            sysUser.setEmail(userExMerchant.getEmail());
            sysUser.setUserId(userExMerchant.getUserId());
            if (!this.iSysUserService.checkUserNameUnique(sysUser)) {
                return this.error("\u767b\u5f55\u8d26\u53f7" + sysUser.getUserName() + "\u5df2\u5b58\u5728");
            }
            if (StringUtils.isNotEmpty((String)sysUser.getPhonenumber()) && !this.iSysUserService.checkPhoneUnique(sysUser)) {
                return this.error("\u65b0\u589e\u7528\u6237'" + sysUser.getUserName() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
            }
            if (StringUtils.isNotEmpty((String)sysUser.getEmail()) && !this.iSysUserService.checkEmailUnique(sysUser)) {
                return this.error("\u65b0\u589e\u7528\u6237'" + sysUser.getUserName() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
            }
            int count = this.iSysUserService.updateUser(sysUser);
            if (count <= 0) {
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u66f4\u65b0\u5546\u5bb6\u5931\u8d25");
                return ajaxResult;
            }
        }
        return this.toAjax(this.userExMerchantService.updateUserExMerchant(userExMerchant));
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:remove')")
    @Log(title="\u5546\u6237", businessType=BusinessType.DELETE)
    @DeleteMapping(value={"/{ids}"})
    public AjaxResult remove(@PathVariable Long[] ids) {
        return this.toAjax(this.userExMerchantService.deleteUserExMerchantByIds(ids));
    }

    @PreAuthorize(value="@ss.hasPermi('system:merchant:audit')")
    @Log(title="\u5546\u6237", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/audit"})
    public AjaxResult audit(@RequestBody UserExMerchant userExMerchant) {
        UserExMerchantAuditLog userExMerchantAuditLog = null;
        if (null != userExMerchant.getId()) {
            userExMerchantAuditLog = new UserExMerchantAuditLog();
            userExMerchantAuditLog.setMerchantId(userExMerchant.getId());
            userExMerchantAuditLog.setOperatStatus(userExMerchant.getStatus());
            if (userExMerchant.getStatus() == 3L) {
                userExMerchantAuditLog.setOperatName("\u5ba1\u6838\u901a\u8fc7");
                SysUser sysUser = new SysUser();
                sysUser.setUserId(userExMerchant.getUserId());
                sysUser.setStatus(UserStatus.OK.getCode());
                this.iSysUserService.updateUserStatus(sysUser);
            } else if (userExMerchant.getStatus() == 2L) {
                userExMerchantAuditLog.setOperatName("\u5ba1\u6838\u62d2\u7edd");
                userExMerchantAuditLog.setOperateRemark(userExMerchant.getReason());
            }
            userExMerchantAuditLog.setOperateByUserId(this.getUserId());
            userExMerchantAuditLog.setOperateByName(this.getLoginUser().getUser().getLegalName());
        }
        return this.toAjax(this.userExMerchantService.auditUserExMerchant(userExMerchant, userExMerchantAuditLog));
    }
}
