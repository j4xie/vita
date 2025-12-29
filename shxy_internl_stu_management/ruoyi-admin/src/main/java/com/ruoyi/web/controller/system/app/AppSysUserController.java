package com.ruoyi.web.controller.system.app;

import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.constant.Constants;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.domain.model.LoginBody;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.utils.LogUtils;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.framework.web.domain.server.Sys;
import com.ruoyi.framework.web.service.SysLoginService;
import com.ruoyi.system.domain.Invitation;
import com.ruoyi.system.domain.SysUserExLevel;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.service.*;
import com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl;
import org.apache.http.util.TextUtils;
import org.aspectj.weaver.loadtime.Aj;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/app/user")
public class AppSysUserController extends BaseController {


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

    /**
     * 新增用户
     * @param  isEmailVerify  传1表示邮箱验证，否则不传
     */
    @Transactional(rollbackFor = Exception.class)
    @Log(title = "APP用户管理", businessType = BusinessType.INSERT)
    @PostMapping("/add")
    public AjaxResult add(SysUser user, String isEmailVerify)
    {
        try{
            //deptService.checkDeptDataScope(user.getDeptId());
            //roleService.checkRoleDataScope(user.getRoleIds());
            if (!userService.checkUserNameUnique(user))
            {
                return error("新增用户'" + user.getUserName() + "'失败，登录账号已存在");
            }
            else if (StringUtils.isNotEmpty(user.getPhonenumber()) && !userService.checkPhoneUnique(user))
            {
                return error("新增用户'" + user.getUserName() + "'失败，手机号码已存在");
            }
            else if (StringUtils.isNotEmpty(user.getEmail()) && !userService.checkEmailUnique(user))
            {
                return error("新增用户'" + user.getUserName() + "'失败，邮箱账号已存在");
            }

            if(!TextUtils.isEmpty(isEmailVerify) && "1".equals(isEmailVerify)){
                //邮箱验证
                user.setIsEmailVerify(1);
            }else{

                //验证邀请码
                if((null == user.getVerCode() || TextUtils.isEmpty(user.getVerCode())) && !TextUtils.isEmpty(user.getInvCode())){
                    if(null != user.getInvCode()){
                        Invitation invitation = new Invitation();
                        invitation.setInvCode(user.getInvCode());
                        List<Invitation> list = invitationService.selectInvitationList(invitation);
                        if(list.size() <= 0){
                            //邀请码不可用
                            AjaxResult ajaxResult = AjaxResult.error();
                            ajaxResult.put("msg", "邀请码失效");
                            return ajaxResult;
                        }
                    }
                }

                if(!TextUtils.isEmpty(user.getPhonenumber()) && TextUtils.isEmpty(user.getInvCode()) && !TextUtils.isEmpty(user.getAreaCode())){
                    if(null == user.getVerCode() || TextUtils.isEmpty(user.getVerCode()) || user.getVerCode().length() != 6){
                        AjaxResult ajaxResult = AjaxResult.error();
                        ajaxResult.put("msg", "请输入验证码");
                        return ajaxResult;
                    }
                    if(TextUtils.isEmpty(user.getBizId())){
                        AjaxResult ajaxResult = AjaxResult.error();
                        ajaxResult.put("msg", "请先获取验证码");
                        return ajaxResult;
                    }

                    if(TextUtils.isEmpty(user.getAreaCode()) || "86".equals(user.getAreaCode()) || "+86".equals(user.getAreaCode())){
                        QuerySendDetailsResponse querySendDetailsResponse = aliyunSmsSenderServiceImpl.querySendDetails(user.getBizId(),
                                user.getPhonenumber(), 10L, 1L);
                        if ("OK".equals(querySendDetailsResponse.getCode()) && !querySendDetailsResponse.getSmsSendDetailDTOs().isEmpty()
                                && querySendDetailsResponse.getSmsSendDetailDTOs().size() > 0){
                            String content = querySendDetailsResponse.getSmsSendDetailDTOs().get(0).getContent();
                            if(!content.contains(user.getVerCode())){
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
                        QueryMessageResponse querySendDetailsResponse = aliyunSmsSenderServiceImpl.queryGlobeSendDetails(user.getBizId());
                        if(null != querySendDetailsResponse && "OK".equals(querySendDetailsResponse.getBody().responseCode)){
                            if(!user.getVerCode().equals(querySendDetailsResponse.getBody().message)){
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

                }

            }


            //用户端注册的默认全部为普通用户
            SysRole sysRole = new SysRole();
            sysRole.setRoleKey("common");
            SysRole sysRoleDTO = roleService.selectRoleByCon(sysRole);
            if(null != sysRoleDTO){
                Long [] rolIds = {sysRoleDTO.getRoleId()};
                user.setRoleIds(rolIds);
            }

            user.setCreateBy("self");
            user.setPassword(SecurityUtils.encryptPassword(user.getPassword()));


            int pos = userService.insertUser(user);

            if(!TextUtils.isEmpty(isEmailVerify) && "1".equals(isEmailVerify)) {
                //邮箱验证
                //赋予蓝卡会员等级
                //先判断当前会员等级，如果永久会员等级高于蓝卡，则不变
                //送会员
                SysUserExLevel sysUserExLevel = new SysUserExLevel();
                sysUserExLevel.setUserId(user.getUserId());
                int res = sysUserExLevelService.verifyEmailSendUserLevel(sysUserExLevel);
                if(res == 0){
                    System.out.println("认证送会员失败:"+user.getUserId());
                }else if(res < 0){
                    System.out.println("认证无可送会员:"+user.getUserId());
                }else if(res > 0){
                    System.out.println("认证送会员成功:"+user.getUserId());
                }
            }else{
                //注册送会员
                SysUserExLevel sysUserExLevel = new SysUserExLevel();
                sysUserExLevel.setUserId(user.getUserId());
                int count = sysUserExLevelService.registerSendUserLevel(sysUserExLevel);
                if(count == 0){
                    System.out.println("注册送会员失败");
                }else if(count < 0){
                    System.out.println("注册无可送会员");
                }else if(count > 0){
                    System.out.println("注册送会员成功");
                }
            }

            return toAjax(pos);
        }catch (Exception e){
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "注册失败");
            return ajaxResult;
        }
    }


    /**
     * 根据用户编号获取详细信息
     */
    @GetMapping(value = { "/info" })
    public AjaxResult getInfo(Long userId)
    {
        AjaxResult ajax = AjaxResult.success();
        if (StringUtils.isNotNull(userId))
        {
            //userService.checkUserDataScope(userId);
            SysUser sysUser = userService.selectUserById(userId);
            if(null != sysUser.getDept()){
                if(sysUser.getDept().getParentId() > 1){
                    //获取父级部门并拼上
                    SysDept sysDept = deptService.selectDeptById(sysUser.getDept().getParentId());
                    if(null != sysDept){
                        sysDept.setChildrenDept(sysUser.getDept());
                        sysUser.setDept(sysDept);
                    }
                }
            }

            Long postId = postService.selectPostIdByUserId(userId);
            if(null != postId){
                sysUser.setPost(postService.selectPostById(postId));
            }
            ajax.put(AjaxResult.DATA_TAG, sysUser);
        }
        return ajax;
    }

    /**
     * 注销用户
     * @param userId
     * @return
     */
    @GetMapping(value = { "/logoff" })
    public AjaxResult logoff(Long userId)
    {
        AjaxResult ajax = null;
        if (StringUtils.isNotNull(userId))
        {
            int count = userService.deleteUserById(userId);
            if(count > 0){
                ajax = AjaxResult.success();
                ajax.put(AjaxResult.MSG_TAG, "注销成功");
            }else{
                ajax = AjaxResult.error();
                ajax.put(AjaxResult.MSG_TAG, "注销失败");
            }
        }else{
            ajax = AjaxResult.error();
            ajax.put(AjaxResult.MSG_TAG, "用户信息不能为空");
        }
        return ajax;
    }

    /**
     * 修改用户
     */
    @Log(title = "用户管理", businessType = BusinessType.UPDATE)
    @PostMapping(value = { "/edit" })
    public AjaxResult edit(SysUser user)
    {
        //userService.checkUserAllowed(user);
        //userService.checkUserDataScope(user.getUserId());
        //deptService.checkDeptDataScope(user.getDeptId());
        //roleService.checkRoleDataScope(user.getRoleIds());
        if (!userService.checkUserNameUnique(user))
        {
            return error("修改用户'" + user.getUserName() + "'失败，登录账号已存在");
        }
        else if (StringUtils.isNotEmpty(user.getPhonenumber()) && !userService.checkPhoneUnique(user))
        {
            return error("修改用户'" + user.getUserName() + "'失败，手机号码已存在");
        }
        else if (StringUtils.isNotEmpty(user.getEmail()) && !userService.checkEmailUnique(user))
        {
            return error("修改用户'" + user.getUserName() + "'失败，邮箱账号已存在");
        }
        if(!TextUtils.isEmpty(user.getPassword())){
            user.setPassword(SecurityUtils.encryptPassword(user.getPassword()));
        }
        if(null != user.getPostId() && (null == user.getPostIds() || user.getPostIds().length == 0)){
            user.setPostIds(new Long[]{user.getPostId()});
        }
        if(null != user.getRoleId() && (null == user.getRoleIds() || user.getRoleIds().length == 0)){
            user.setRoleIds(new Long[]{user.getRoleId()});
        }
        user.setUpdateBy(getUsername());
        return toAjax(userService.updateUser(user));
    }

    /**
     * 获取用户列表
     */
    @PreAuthorize("@ss.hasPermi('system:user:list')")
    @PostMapping("/list")
    public TableDataInfo list(SysUser user)
    {
        startPage();
        List<SysUser> list = userService.selectUserListForApp(user);
        return getDataTable(list);
    }


    /**
     * 认证邮箱接口
     * @param user
     * @return
     */
    @Transactional(rollbackFor = Exception.class)
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/verifyEmail")
    public AjaxResult verifyEmail(SysUser user)
    {
        try{
            if(null == user || null == user.getUserId()){
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "参数缺失");
                return ajaxResult;
            }

            SysUser sysUserDTO = new SysUser();
            sysUserDTO.setUserId(user.getUserId());
            sysUserDTO.setIsEmailVerify(1);
            int count = userService.updateUserVerifyEmail(sysUserDTO);
            if(count > 0){
                //赋予蓝卡会员等级
                //先判断当前会员等级，如果永久会员等级高于蓝卡，则不变
                //送会员
                SysUserExLevel sysUserExLevel = new SysUserExLevel();
                sysUserExLevel.setUserId(user.getUserId());
                int res = sysUserExLevelService.verifyEmailSendUserLevel(sysUserExLevel);
                if(res == 0){
                    System.out.println("认证送会员失败:"+user.getUserId());
                }else if(res < 0){
                    System.out.println("认证无可送会员:"+user.getUserId());
                }else if(res > 0){
                    System.out.println("认证送会员成功:"+user.getUserId());
                }
            }

            return toAjax(count);
        }catch (Exception e){
            //强制事务回滚
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "认证失败");
            return ajaxResult;
        }
    }


    /**
     * 获取用户积分数据
     */
    @PreAuthorize("@ss.hasPermi('system:role:client')")
    @PostMapping("/userPoint")
    public AjaxResult userPoint()
    {
        UserExtendsData userExtendsData = userExtendsDataService.selectUserExtendsDataByUserId(getUserId());
        if(null == userExtendsData){
            AjaxResult ajaxResult = AjaxResult.success();
            ajaxResult.put("point", 0);
            return ajaxResult;
        }

        BigDecimal noZeros = userExtendsData.getUserPoint().stripTrailingZeros();
        String result = noZeros.toPlainString();
        AjaxResult ajaxResult = AjaxResult.success();
        ajaxResult.put("point", result);
        return ajaxResult;
    }
}
