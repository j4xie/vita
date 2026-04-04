/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.domain.model.LoginBody
 *  com.ruoyi.common.core.domain.model.LoginUser
 *  com.ruoyi.common.core.text.Convert
 *  com.ruoyi.common.utils.DateUtils
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.framework.web.service.SysLoginService
 *  com.ruoyi.framework.web.service.SysPermissionService
 *  com.ruoyi.framework.web.service.TokenService
 *  com.ruoyi.system.service.ISysConfigService
 *  com.ruoyi.system.service.ISysMenuService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.domain.model.LoginBody;
import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.core.text.Convert;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.framework.web.service.SysLoginService;
import com.ruoyi.framework.web.service.SysPermissionService;
import com.ruoyi.framework.web.service.TokenService;
import com.ruoyi.system.service.ISysConfigService;
import com.ruoyi.system.service.ISysMenuService;
import java.util.Date;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SysLoginController {
    @Autowired
    private SysLoginService loginService;
    @Autowired
    private ISysMenuService menuService;
    @Autowired
    private SysPermissionService permissionService;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private ISysConfigService configService;

    @PostMapping(value={"/login"})
    public AjaxResult login(@RequestBody LoginBody loginBody) {
        AjaxResult ajax = AjaxResult.success();
        String token = this.loginService.login(loginBody.getUsername(), loginBody.getPassword(), loginBody.getCode(), loginBody.getUuid());
        ajax.put("token", (Object)token);
        return ajax;
    }

    @GetMapping(value={"getInfo"})
    public AjaxResult getInfo() {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        SysUser user = loginUser.getUser();
        Set roles = this.permissionService.getRolePermission(user);
        Set permissions = this.permissionService.getMenuPermission(user);
        if (!loginUser.getPermissions().equals(permissions)) {
            loginUser.setPermissions(permissions);
            this.tokenService.refreshToken(loginUser);
        }
        AjaxResult ajax = AjaxResult.success();
        ajax.put("user", (Object)user);
        ajax.put("roles", (Object)roles);
        ajax.put("permissions", (Object)permissions);
        ajax.put("isDefaultModifyPwd", (Object)this.initPasswordIsModify(user.getPwdUpdateDate()));
        ajax.put("isPasswordExpired", (Object)this.passwordIsExpiration(user.getPwdUpdateDate()));
        return ajax;
    }

    @GetMapping(value={"getRouters"})
    public AjaxResult getRouters() {
        Long userId = SecurityUtils.getUserId();
        List menus = this.menuService.selectMenuTreeByUserId(userId);
        return AjaxResult.success((Object)this.menuService.buildMenus(menus));
    }

    public boolean initPasswordIsModify(Date pwdUpdateDate) {
        Integer initPasswordModify = Convert.toInt((Object)this.configService.selectConfigByKey("sys.account.initPasswordModify"));
        return initPasswordModify != null && initPasswordModify == 1 && pwdUpdateDate == null;
    }

    public boolean passwordIsExpiration(Date pwdUpdateDate) {
        Integer passwordValidateDays = Convert.toInt((Object)this.configService.selectConfigByKey("sys.account.passwordValidateDays"));
        if (passwordValidateDays != null && passwordValidateDays > 0) {
            if (StringUtils.isNull((Object)pwdUpdateDate)) {
                return true;
            }
            Date nowDate = DateUtils.getNowDate();
            return DateUtils.differentDaysByMillisecond((Date)nowDate, (Date)pwdUpdateDate) > passwordValidateDays;
        }
        return false;
    }
}
