/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse$SmsSendDetailDTO
 *  com.ruoyi.common.annotation.Log
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.page.TableDataInfo
 *  com.ruoyi.common.enums.BusinessType
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.system.domain.Invitation
 *  com.ruoyi.system.domain.SysUserExLevel
 *  com.ruoyi.system.domain.UserExtendsData
 *  com.ruoyi.system.email.EmailCheckService
 *  com.ruoyi.system.service.IInvitationService
 *  com.ruoyi.system.service.ISysDeptService
 *  com.ruoyi.system.service.ISysPostService
 *  com.ruoyi.system.service.ISysRoleService
 *  com.ruoyi.system.service.ISysUserExLevelService
 *  com.ruoyi.system.service.ISysUserService
 *  com.ruoyi.system.service.IUserExtendsDataLogService
 *  com.ruoyi.system.service.IUserExtendsDataService
 *  com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.security.access.prepost.PreAuthorize
 *  org.springframework.transaction.annotation.Transactional
 *  org.springframework.transaction.interceptor.TransactionAspectSupport
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.system.app;

import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.email.EmailCheckService;
import com.ruoyi.system.service.IInvitationService;
import com.ruoyi.system.service.ISysDeptService;
import com.ruoyi.system.service.ISysPostService;
import com.ruoyi.system.service.ISysRoleService;
import com.ruoyi.system.service.ISysUserExLevelService;
import com.ruoyi.system.service.ISysUserService;
import com.ruoyi.system.service.IUserExtendsDataLogService;
import com.ruoyi.system.service.IUserExtendsDataService;
import com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl;
import java.math.BigDecimal;
import java.util.List;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/app/user"})
public class AppSysUserController
extends BaseController {
    @Autowired
    private ISysRoleService roleService;
    @Autowired
    private ISysUserService userService;
    @Autowired
    private ISysPostService postService;
    @Autowired
    private IInvitationService invitationService;
    @Autowired
    private AliyunSmsSenderServiceImpl aliyunSmsSenderServiceImpl;
    @Autowired
    private ISysDeptService deptService;
    @Autowired
    private ISysUserExLevelService sysUserExLevelService;
    @Autowired
    private IUserExtendsDataService userExtendsDataService;
    @Autowired
    private IUserExtendsDataLogService userExtendsDataLogService;

    /*
     * Enabled aggressive block sorting
     * Enabled unnecessary exception pruning
     * Enabled aggressive exception aggregation
     */
    @Transactional(rollbackFor={Exception.class})
    @Log(title="APP\u7528\u6237\u7ba1\u7406", businessType=BusinessType.INSERT)
    @PostMapping(value={"/add"})
    public AjaxResult add(SysUser user, String isEmailVerify) {
        try {
            block30: {
                if (!this.userService.checkUserNameUnique(user)) {
                    return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u767b\u5f55\u8d26\u53f7\u5df2\u5b58\u5728");
                }
                if (StringUtils.isNotEmpty((String)user.getPhonenumber()) && !this.userService.checkPhoneUnique(user)) {
                    return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
                }
                if (StringUtils.isNotEmpty((String)user.getEmail()) && !this.userService.checkEmailUnique(user)) {
                    return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
                }
                if (!TextUtils.isEmpty((CharSequence)isEmailVerify) && "1".equals(isEmailVerify)) {
                    user.setIsEmailVerify(Integer.valueOf(1));
                    boolean res = EmailCheckService.getInstance().hasEmailVeryCode(user.getEmail(), user.getVerCode());
                    if (!res) {
                        AjaxResult ajaxResult = AjaxResult.error();
                        ajaxResult.put("msg", (Object)"\u90ae\u7bb1\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                        return ajaxResult;
                    }
                } else {
                    if ((null == user.getVerCode() || TextUtils.isEmpty((CharSequence)user.getVerCode())) && !TextUtils.isEmpty((CharSequence)user.getInvCode()) && null != user.getInvCode()) {
                        Invitation invitation = new Invitation();
                        invitation.setInvCode(user.getInvCode());
                        List list = this.invitationService.selectInvitationList(invitation);
                        if (list.size() <= 0) {
                            AjaxResult ajaxResult = AjaxResult.error();
                            ajaxResult.put("msg", (Object)"\u9080\u8bf7\u7801\u5931\u6548");
                            return ajaxResult;
                        }
                    }
                    if (!TextUtils.isEmpty((CharSequence)user.getPhonenumber()) && TextUtils.isEmpty((CharSequence)user.getInvCode()) && !TextUtils.isEmpty((CharSequence)user.getAreaCode())) {
                        AjaxResult ajaxResult;
                        QuerySendDetailsResponse querySendDetailsResponse;
                        AjaxResult ajaxResult2;
                        if (null == user.getVerCode() || TextUtils.isEmpty((CharSequence)user.getVerCode()) || user.getVerCode().length() != 6) {
                            ajaxResult2 = AjaxResult.error();
                            ajaxResult2.put("msg", (Object)"\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801");
                            return ajaxResult2;
                        }
                        if (TextUtils.isEmpty((CharSequence)user.getBizId())) {
                            ajaxResult2 = AjaxResult.error();
                            ajaxResult2.put("msg", (Object)"\u8bf7\u5148\u83b7\u53d6\u9a8c\u8bc1\u7801");
                            return ajaxResult2;
                        }
                        if (TextUtils.isEmpty((CharSequence)user.getAreaCode()) || "86".equals(user.getAreaCode()) || "+86".equals(user.getAreaCode())) {
                            querySendDetailsResponse = this.aliyunSmsSenderServiceImpl.querySendDetails(user.getBizId(), user.getPhonenumber(), Long.valueOf(10L), Long.valueOf(1L));
                            if ("OK".equals(querySendDetailsResponse.getCode()) && !querySendDetailsResponse.getSmsSendDetailDTOs().isEmpty() && querySendDetailsResponse.getSmsSendDetailDTOs().size() > 0) {
                                String content = ((QuerySendDetailsResponse.SmsSendDetailDTO)querySendDetailsResponse.getSmsSendDetailDTOs().get(0)).getContent();
                                if (!content.contains(user.getVerCode())) {
                                    AjaxResult ajaxResult3 = AjaxResult.error();
                                    ajaxResult3.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                                    return ajaxResult3;
                                }
                                break block30;
                            } else {
                                ajaxResult = AjaxResult.error();
                                ajaxResult.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                                return ajaxResult;
                            }
                        }
                        querySendDetailsResponse = this.aliyunSmsSenderServiceImpl.queryGlobeSendDetails(user.getBizId());
                        if (null != querySendDetailsResponse && "OK".equals(querySendDetailsResponse.getBody().responseCode)) {
                            if (null == querySendDetailsResponse.getBody() || TextUtils.isEmpty((CharSequence)querySendDetailsResponse.getBody().message) || !querySendDetailsResponse.getBody().message.contains(user.getVerCode())) {
                                ajaxResult = AjaxResult.error();
                                ajaxResult.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                                return ajaxResult;
                            }
                        } else {
                            ajaxResult = AjaxResult.error();
                            ajaxResult.put("msg", (Object)"\u9a8c\u8bc1\u7801\u4e0d\u6b63\u786e");
                            return ajaxResult;
                        }
                    }
                }
            }
            SysRole sysRole = new SysRole();
            if (!TextUtils.isEmpty((CharSequence)isEmailVerify) && "1".equals(isEmailVerify)) {
                if (user.getEmail().endsWith("@chineseunion.org")) {
                    sysRole.setRoleKey("staff");
                } else {
                    sysRole.setRoleKey("common");
                }
            } else {
                sysRole.setRoleKey("common");
            }
            SysRole sysRoleDTO = this.roleService.selectRoleByCon(sysRole);
            if (null != sysRoleDTO) {
                Long[] rolIds = new Long[]{sysRoleDTO.getRoleId()};
                user.setRoleIds(rolIds);
            }
            user.setCreateBy("self");
            user.setPassword(SecurityUtils.encryptPassword((String)user.getPassword()));
            int pos = this.userService.insertUser(user);
            if (!TextUtils.isEmpty((CharSequence)isEmailVerify) && "1".equals(isEmailVerify)) {
                SysUserExLevel sysUserExLevel = new SysUserExLevel();
                sysUserExLevel.setUserId(user.getUserId());
                int res = this.sysUserExLevelService.verifyEmailSendUserLevel(sysUserExLevel);
                if (res == 0) {
                    System.out.println("\u8ba4\u8bc1\u9001\u4f1a\u5458\u5931\u8d25:" + user.getUserId());
                    return this.toAjax(pos);
                }
                if (res < 0) {
                    System.out.println("\u8ba4\u8bc1\u65e0\u53ef\u9001\u4f1a\u5458:" + user.getUserId());
                    return this.toAjax(pos);
                }
                if (res <= 0) return this.toAjax(pos);
                System.out.println("\u8ba4\u8bc1\u9001\u4f1a\u5458\u6210\u529f:" + user.getUserId());
                return this.toAjax(pos);
            }
            SysUserExLevel sysUserExLevel = new SysUserExLevel();
            sysUserExLevel.setUserId(user.getUserId());
            int count = this.sysUserExLevelService.registerSendUserLevel(sysUserExLevel);
            if (count == 0) {
                System.out.println("\u6ce8\u518c\u9001\u4f1a\u5458\u5931\u8d25");
                return this.toAjax(pos);
            }
            if (count < 0) {
                System.out.println("\u6ce8\u518c\u65e0\u53ef\u9001\u4f1a\u5458");
                return this.toAjax(pos);
            }
            if (count <= 0) return this.toAjax(pos);
            System.out.println("\u6ce8\u518c\u9001\u4f1a\u5458\u6210\u529f");
            return this.toAjax(pos);
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u6ce8\u518c\u5931\u8d25");
            return ajaxResult;
        }
    }

    @GetMapping(value={"/info"})
    public AjaxResult getInfo(Long userId) {
        AjaxResult ajax = AjaxResult.success();
        if (StringUtils.isNotNull((Object)userId)) {
            Long postId;
            SysDept sysDept;
            SysUser sysUser = this.userService.selectUserById(userId);
            if (null != sysUser.getDept() && sysUser.getDept().getParentId() > 1L && null != (sysDept = this.deptService.selectDeptById(sysUser.getDept().getParentId()))) {
                sysDept.setChildrenDept(sysUser.getDept());
                sysUser.setDept(sysDept);
            }
            if (null != (postId = this.postService.selectPostIdByUserId(userId))) {
                sysUser.setPost(this.postService.selectPostById(postId));
            }
            List userExtendsDataLogList = this.userExtendsDataLogService.selectUserExtendsDataLogByUserId(userId);
            sysUser.setUserExtendsDataLogList(userExtendsDataLogList);
            ajax.put("data", (Object)sysUser);
        }
        return ajax;
    }

    @GetMapping(value={"/logoff"})
    public AjaxResult logoff(Long userId) {
        AjaxResult ajax = null;
        if (StringUtils.isNotNull((Object)userId)) {
            int count = this.userService.deleteUserById(userId);
            if (count > 0) {
                ajax = AjaxResult.success();
                ajax.put("msg", (Object)"\u6ce8\u9500\u6210\u529f");
            } else {
                ajax = AjaxResult.error();
                ajax.put("msg", (Object)"\u6ce8\u9500\u5931\u8d25");
            }
        } else {
            ajax = AjaxResult.error();
            ajax.put("msg", (Object)"\u7528\u6237\u4fe1\u606f\u4e0d\u80fd\u4e3a\u7a7a");
        }
        return ajax;
    }

    @Log(title="\u7528\u6237\u7ba1\u7406", businessType=BusinessType.UPDATE)
    @PostMapping(value={"/edit"})
    public AjaxResult edit(SysUser user) {
        if (!this.userService.checkUserNameUnique(user)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u767b\u5f55\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getPhonenumber()) && !this.userService.checkPhoneUnique(user)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
        }
        if (StringUtils.isNotEmpty((String)user.getEmail()) && !this.userService.checkEmailUnique(user)) {
            return this.error("\u4fee\u6539\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
        }
        if (!TextUtils.isEmpty((CharSequence)user.getPassword())) {
            user.setPassword(SecurityUtils.encryptPassword((String)user.getPassword()));
        }
        if (null != user.getPostId() && (null == user.getPostIds() || user.getPostIds().length == 0)) {
            user.setPostIds(new Long[]{user.getPostId()});
        }
        if (null != user.getRoleId() && (null == user.getRoleIds() || user.getRoleIds().length == 0)) {
            user.setRoleIds(new Long[]{user.getRoleId()});
        }
        user.setUpdateBy(this.getUsername());
        return this.toAjax(this.userService.updateUser(user));
    }

    @PreAuthorize(value="@ss.hasPermi('system:user:list')")
    @PostMapping(value={"/list"})
    public TableDataInfo list(SysUser user) {
        this.startPage();
        List list = this.userService.selectUserListForApp(user);
        return this.getDataTable(list);
    }

    @Transactional(rollbackFor={Exception.class})
    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/verifyEmail"})
    public AjaxResult verifyEmail(SysUser user) {
        try {
            if (null == user || null == user.getUserId()) {
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", (Object)"\u53c2\u6570\u7f3a\u5931");
                return ajaxResult;
            }
            SysUser sysUserDTO = new SysUser();
            sysUserDTO.setUserId(user.getUserId());
            sysUserDTO.setIsEmailVerify(Integer.valueOf(1));
            int count = this.userService.updateUserVerifyEmail(sysUserDTO);
            if (count > 0) {
                SysUserExLevel sysUserExLevel = new SysUserExLevel();
                sysUserExLevel.setUserId(user.getUserId());
                int res = this.sysUserExLevelService.verifyEmailSendUserLevel(sysUserExLevel);
                if (res == 0) {
                    System.out.println("\u8ba4\u8bc1\u9001\u4f1a\u5458\u5931\u8d25:" + user.getUserId());
                } else if (res < 0) {
                    System.out.println("\u8ba4\u8bc1\u65e0\u53ef\u9001\u4f1a\u5458:" + user.getUserId());
                } else if (res > 0) {
                    System.out.println("\u8ba4\u8bc1\u9001\u4f1a\u5458\u6210\u529f:" + user.getUserId());
                }
            }
            return this.toAjax(count);
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", (Object)"\u8ba4\u8bc1\u5931\u8d25");
            return ajaxResult;
        }
    }

    @PreAuthorize(value="@ss.hasPermi('system:role:client')")
    @PostMapping(value={"/userPoint"})
    public AjaxResult userPoint() {
        UserExtendsData userExtendsData = this.userExtendsDataService.selectUserExtendsDataByUserId(this.getUserId());
        if (null == userExtendsData) {
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("point", (Object)0);
            return ajaxResult;
        }
        BigDecimal noZeros = userExtendsData.getUserPoint().stripTrailingZeros();
        String result = noZeros.toPlainString();
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("point", (Object)result);
        return ajaxResult;
    }

    @PostMapping(value={"/checkUserName"})
    public AjaxResult checkUserName(String userName) {
        AjaxResult ajax = null;
        SysUser user = new SysUser();
        user.setUserName(userName);
        try {
            if (!this.userService.checkUserNameUnique(user)) {
                return this.error("\u65b0\u589e\u7528\u6237'" + user.getUserName() + "'\u5931\u8d25\uff0c\u767b\u5f55\u8d26\u53f7\u5df2\u5b58\u5728");
            }
            ajax = AjaxResult.success();
            ajax.put("msg", (Object)"\u7528\u6237\u540d\u53ef\u7528");
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            ajax = AjaxResult.error();
            ajax.put("msg", (Object)"\u6ce8\u518c\u5931\u8d25");
            return ajax;
        }
        return ajax;
    }

    @PostMapping(value={"/checkPhonenumber"})
    public AjaxResult checkPhonenumber(String phonenumber) {
        AjaxResult ajax = null;
        SysUser user = new SysUser();
        user.setPhonenumber(phonenumber);
        try {
            if (StringUtils.isNotEmpty((String)user.getPhonenumber()) && !this.userService.checkPhoneUnique(user)) {
                return this.error("\u624b\u673a\u53f7\u7801\u5df2\u5b58\u5728");
            }
            ajax = AjaxResult.success();
            ajax.put("msg", (Object)"\u624b\u673a\u53f7\u53ef\u7528");
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            ajax = AjaxResult.error();
            ajax.put("msg", (Object)"\u6ce8\u518c\u5931\u8d25");
            return ajax;
        }
        return ajax;
    }

    @PostMapping(value={"/checkEmail"})
    public AjaxResult checkEmail(String email) {
        AjaxResult ajax = null;
        SysUser user = new SysUser();
        user.setEmail(email);
        try {
            if (StringUtils.isNotEmpty((String)user.getEmail()) && !this.userService.checkEmailUnique(user)) {
                return this.error("\u90ae\u7bb1\u8d26\u53f7\u5df2\u5b58\u5728");
            }
            ajax = AjaxResult.success();
            ajax.put("msg", (Object)"\u90ae\u7bb1\u53ef\u7528");
        }
        catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            ajax = AjaxResult.error();
            ajax.put("msg", (Object)"\u6ce8\u518c\u5931\u8d25");
            return ajax;
        }
        return ajax;
    }
}
