/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse$SmsSendDetailDTO
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.domain.model.LoginBody
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.framework.web.service.SysLoginService
 *  com.ruoyi.system.email.EmailCheckService
 *  com.ruoyi.system.service.IInvitationService
 *  com.ruoyi.system.service.ISysUserService
 *  com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.domain.model.LoginBody;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.framework.web.service.SysLoginService;
import com.ruoyi.system.email.EmailCheckService;
import com.ruoyi.system.service.IInvitationService;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl;
import java.util.Map;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app"})
public class AppSysLoginController
extends BaseController {
    @Autowired
    private SysLoginService loginService;
    @Autowired
    private AliyunSmsSenderServiceImpl aliyunSmsSenderServiceImpl;
    @Autowired
    private ISysUserService userService;
    @Autowired
    private IInvitationService invitationService;

    @PostMapping(value={"/login"})
    public AjaxResult login(LoginBody loginBody) {
        AjaxResult ajax = AjaxResult.success();
        Map data = this.loginService.appLogin(loginBody.getUsername(), loginBody.getPassword(), loginBody.getUuid());
        ajax.put("data", (Object)data);
        System.out.println("\u767b\u5f55\u7ed3\u679c--" + data.toString());
        return ajax;
    }

    /*
     * Enabled aggressive block sorting
     */
    @PostMapping(value={"/resetPwd"})
    public AjaxResult resetPwd(String verCode, String bizId, String password, String phonenumber, String areaCode, String email, int flag) {
        QuerySendDetailsResponse querySendDetailsResponse;
        AjaxResult ajaxResult;
        if (1 == flag) {
            if (TextUtils.isEmpty((CharSequence)phonenumber)) {
                AjaxResult ajaxResult2 = AjaxResult.error();
                ajaxResult2.put("msg", (Object)"\u8bf7\u8f93\u5165\u624b\u673a\u53f7");
                return ajaxResult2;
            }
            SysUser user = this.userService.selectUserByPhoneNumber(phonenumber);
            if (null == user) {
                AjaxResult ajaxResult3 = AjaxResult.error();
                ajaxResult3.put("msg", (Object)"\u8f93\u5165\u7684\u624b\u673a\u53f7\u7528\u6237\u4e0d\u5b58\u5728");
                return ajaxResult3;
            }
        } else {
            if (-1 != flag) {
                AjaxResult ajaxResult4 = AjaxResult.error();
                ajaxResult4.put("msg", (Object)"\u9a8c\u8bc1\u65b9\u5f0f\u6709\u8bef");
                return ajaxResult4;
            }
            boolean res = EmailCheckService.getInstance().hasEmailVeryCode(email, verCode);
            if (!res) {
                AjaxResult ajaxResult5 = AjaxResult.error();
                ajaxResult5.put("msg", (Object)"\u90ae\u7bb1\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                return ajaxResult5;
            }
        }
        if (TextUtils.isEmpty((CharSequence)verCode) || verCode.length() != 6) {
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801");
            return ajaxResult;
        }
        if (TextUtils.isEmpty((CharSequence)bizId)) {
            ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u8bf7\u5148\u83b7\u53d6\u9a8c\u8bc1\u7801");
            return ajaxResult;
        }
        if (1 != flag) return this.toAjax(this.userService.resetUserPwdByPhoneNumber(phonenumber, SecurityUtils.encryptPassword((String)password)));
        if (TextUtils.isEmpty((CharSequence)areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)) {
            querySendDetailsResponse = this.aliyunSmsSenderServiceImpl.querySendDetails(bizId, phonenumber, Long.valueOf(10L), Long.valueOf(1L));
            if ("OK".equals(querySendDetailsResponse.getCode()) && !querySendDetailsResponse.getSmsSendDetailDTOs().isEmpty() && querySendDetailsResponse.getSmsSendDetailDTOs().size() > 0) {
                String content = ((QuerySendDetailsResponse.SmsSendDetailDTO)querySendDetailsResponse.getSmsSendDetailDTOs().get(0)).getContent();
                if (content.contains(verCode)) return this.toAjax(this.userService.resetUserPwdByPhoneNumber(phonenumber, SecurityUtils.encryptPassword((String)password)));
                AjaxResult ajaxResult6 = AjaxResult.error();
                ajaxResult6.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                return ajaxResult6;
            } else {
                AjaxResult ajaxResult7 = AjaxResult.error();
                ajaxResult7.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                return ajaxResult7;
            }
        }
        querySendDetailsResponse = this.aliyunSmsSenderServiceImpl.queryGlobeSendDetails(bizId);
        if (null != querySendDetailsResponse && "OK".equals(querySendDetailsResponse.getBody().responseCode)) {
            if ((null == querySendDetailsResponse || null == querySendDetailsResponse.getBody()) && null == querySendDetailsResponse.getBody().message) {
                AjaxResult ajaxResult8 = AjaxResult.error();
                ajaxResult8.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                return ajaxResult8;
            }
            if (querySendDetailsResponse.getBody().message.contains(verCode)) return this.toAjax(this.userService.resetUserPwdByPhoneNumber(phonenumber, SecurityUtils.encryptPassword((String)password)));
            AjaxResult ajaxResult9 = AjaxResult.error();
            ajaxResult9.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
            return ajaxResult9;
        } else {
            AjaxResult ajaxResult10 = AjaxResult.error();
            ajaxResult10.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
            return ajaxResult10;
        }
    }
}
