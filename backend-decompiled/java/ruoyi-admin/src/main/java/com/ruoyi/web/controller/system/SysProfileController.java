/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.config.RuoYiConfig
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.domain.model.LoginUser
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.DateUtils
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.file.FileUploadUtils
 *  com.ruoyi.common.utils.file.FileUtils
 *  com.ruoyi.common.utils.file.MimeTypeUtils
 *  com.ruoyi.framework.web.service.TokenService
 *  com.ruoyi.system.service.ISysUserService
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.PutMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RequestParam
 *  org.springframework.web.bind.annotation.RestController
 *  org.springframework.web.multipart.MultipartFile
 */
package com.ruoyi.web.controller.system;

import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.config.RuoYiConfig;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.file.FileUploadUtils;
import com.ruoyi.common.utils.file.FileUtils;
import com.ruoyi.common.utils.file.MimeTypeUtils;
import com.ruoyi.framework.web.service.TokenService;
import com.ruoyi.system.service.ISysUserService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value={"/system/user/profile"})
public class SysProfileController
extends BaseController {
    @Autowired
    private ISysUserService userService;
    @Autowired
    private TokenService tokenService;

    @GetMapping
    public AjaxResult profile() {
        LoginUser loginUser = this.getLoginUser();
        SysUser user = loginUser.getUser();
        AjaxResult ajax = AjaxResult.success((Object)user);
        ajax.put("roleGroup", (Object)this.userService.selectUserRoleGroup(loginUser.getUsername()));
        ajax.put("postGroup", (Object)this.userService.selectUserPostGroup(loginUser.getUsername()));
        return ajax;
    }

    @Log(title="\u4e2a\u4eba\u4fe1\u606f", businessType=BusinessType.UPDATE)
    @PutMapping
    public AjaxResult updateProfile(@RequestBody SysUser user) {
        LoginUser loginUser = this.getLoginUser();
        SysUser currentUser = loginUser.getUser();
        currentUser.setNickName(user.getNickName());
        currentUser.setEmail(user.getEmail());
        currentUser.setPhonenumber(user.getPhonenumber());
        currentUser.setSex(user.getSex());
        if (StringUtils.isNotEmpty((String)user.getPhonenumber()) && !this.userService.checkPhoneUnique(currentUser)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + loginUser.getUsername() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getEmail()) && !this.userService.checkEmailUnique(currentUser)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + loginUser.getUsername() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        if (this.userService.updateUserProfile(currentUser) > 0) {
            this.tokenService.setLoginUser(loginUser);
            return this.success();
        }
        return this.error("\u4fee\u6539\u4e2a\u4eba\u4fe1\u606f\u5f02\u5e38\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458");
    }

    @Log(title="\u4e2a\u4eba\u4fe1\u606f", businessType=BusinessType.UPDATE)
    @PutMapping(value={"/updatePwd"})
    public AjaxResult updatePwd(@RequestBody Map<String, String> params) {
        String oldPassword = params.get("oldPassword");
        String newPassword = params.get("newPassword");
        LoginUser loginUser = this.getLoginUser();
        Long userId = loginUser.getUserId();
        String password = loginUser.getPassword();
        if (!SecurityUtils.matchesPassword((String)oldPassword, (String)password)) {
            return this.error("\u4fee\u6539\u5bc6\u7801\u5931\u8d25\uff0c\u65e7\u5bc6\u7801\u9519\u8bef");
        }
        if (SecurityUtils.matchesPassword((String)newPassword, (String)password)) {
            return this.error("\u65b0\u5bc6\u7801\u4e0d\u80fd\u4e0e\u65e7\u5bc6\u7801\u76f8\u540c");
        }
        if (this.userService.resetUserPwd(userId, newPassword = SecurityUtils.encryptPassword((String)newPassword)) > 0) {
            loginUser.getUser().setPwdUpdateDate(DateUtils.getNowDate());
            loginUser.getUser().setPassword(newPassword);
            this.tokenService.setLoginUser(loginUser);
            return this.success();
        }
        return this.error("\u4fee\u6539\u5bc6\u7801\u5f02\u5e38\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458");
    }

    @Log(title="\u7528\u6237\u5934\u50cf", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/avatar"})
    public AjaxResult avatar(@RequestParam(value="avatarfile") MultipartFile file) throws Exception {
        if (!file.isEmpty()) {
            LoginUser loginUser = this.getLoginUser();
            String avatar = FileUploadUtils.upload((String)RuoYiConfig.getAvatarPath(), (MultipartFile)file, (String[])MimeTypeUtils.IMAGE_EXTENSION, (boolean)true);
            if (this.userService.updateUserAvatar(loginUser.getUserId(), avatar)) {
                String oldAvatar = loginUser.getUser().getAvatar();
                if (StringUtils.isNotEmpty((String)oldAvatar)) {
                    FileUtils.deleteFile((String)(RuoYiConfig.getProfile() + FileUtils.stripPrefix((String)oldAvatar)));
                }
                AjaxResult ajax = AjaxResult.success();
                ajax.put("imgUrl", (Object)avatar);
                loginUser.getUser().setAvatar(avatar);
                this.tokenService.setLoginUser(loginUser);
                return ajax;
            }
        }
        return this.error("\u4e0a\u4f20\u56fe\u7247\u5f02\u5e38\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458");
    }
}
