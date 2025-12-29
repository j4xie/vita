package com.ruoyi.web.controller.system.app;

import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.ruoyi.common.constant.Constants;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysMenu;
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
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.service.IInvitationService;
import com.ruoyi.system.service.ISysConfigService;
import com.ruoyi.system.service.ISysMenuService;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 登录验证
 * 
 * @author ruoyi
 */
@RestController
@RequestMapping("/app")
public class AppSysLoginController extends BaseController
{
    @Autowired
    private SysLoginService loginService;

    @Autowired
    private AliyunSmsSenderServiceImpl aliyunSmsSenderServiceImpl;

    @Autowired
    private ISysUserService userService;

    @Autowired
    private IInvitationService invitationService;


    /**
     * 登录方法
     * 
     * @param loginBody 登录信息
     * @return 结果
     */
    @PostMapping("/login")
    public AjaxResult login(LoginBody loginBody)
    {
        AjaxResult ajax = AjaxResult.success();
        // 生成令牌
        Map<String, Object> data = loginService.appLogin(loginBody.getUsername(), loginBody.getPassword(), loginBody.getUuid());
        ajax.put("data", data);
        System.out.println("登录结果--" + data.toString());
        return ajax;
    }

    /**
     * 重置密码
     * @return
     */
    @PostMapping("/resetPwd")
    public AjaxResult resetPwd(String verCode, String bizId, String password, String phonenumber, String areaCode)
    {

        //先判断是否存在当前手机号码的用户
        if(!TextUtils.isEmpty(phonenumber)){
            SysUser user = userService.selectUserByPhoneNumber(phonenumber);
            if(null == user){
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "输入的手机号用户不存在");
                return ajaxResult;
            }
        }else{
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "请输入手机号");
            return ajaxResult;
        }

        if(TextUtils.isEmpty(verCode) || verCode.length() != 6){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "请输入验证码");
            return ajaxResult;
        }
        if(TextUtils.isEmpty(bizId)){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "请先获取验证码");
            return ajaxResult;
        }


        if(TextUtils.isEmpty(areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)){
            //String bizId = UR
            QuerySendDetailsResponse querySendDetailsResponse = aliyunSmsSenderServiceImpl.querySendDetails(bizId,
                    phonenumber, 10L, 1L);
            if ("OK".equals(querySendDetailsResponse.getCode()) && !querySendDetailsResponse.getSmsSendDetailDTOs().isEmpty()
                    && querySendDetailsResponse.getSmsSendDetailDTOs().size() > 0){
                String content = querySendDetailsResponse.getSmsSendDetailDTOs().get(0).getContent();
                if(!content.contains(verCode)){
                    //验证码不对
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "验证码不正确");
                    return ajaxResult;
                }
            }else{
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "验证码不正确");
                return ajaxResult;
            }
        }else{
            QueryMessageResponse querySendDetailsResponse = aliyunSmsSenderServiceImpl.queryGlobeSendDetails(bizId);
            if(null != querySendDetailsResponse && "OK".equals(querySendDetailsResponse.getBody().responseCode)){
                if(!verCode.equals(querySendDetailsResponse.getBody().message)){
                    AjaxResult ajaxResult = AjaxResult.error();
                    ajaxResult.put("msg", "验证码不正确");
                    return ajaxResult;
                }
            }else{
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "验证码不正确");
                return ajaxResult;
            }
        }


        return toAjax(userService.resetUserPwdByPhoneNumber(phonenumber, SecurityUtils.encryptPassword(password)));
    }

}
