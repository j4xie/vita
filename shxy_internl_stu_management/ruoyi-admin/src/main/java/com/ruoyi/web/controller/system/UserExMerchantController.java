package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;

import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.enums.UserStatus;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.service.ISysRoleService;
import com.ruoyi.system.service.ISysUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.service.IUserExMerchantService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 商户Controller
 * 
 * @author ruoyi
 * @date 2025-09-10
 */
@RestController
@RequestMapping("/system/merchant")
public class UserExMerchantController extends BaseController
{
    @Autowired
    private IUserExMerchantService userExMerchantService;

    @Autowired
    ISysUserService iSysUserService;



    /**
     * 查询商户列表
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:list')")
    @GetMapping("/list")
    public TableDataInfo list(UserExMerchant userExMerchant)
    {
        SysRole sysRole = getLoginUser().getUser().getRole();
        if(sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())){
            //总管理员角色&超级管理员

        }else if(sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())){
            //分管理员角色
            userExMerchant.setCreateById(getUserId());
        }
        startPage();
        List<UserExMerchant> list = userExMerchantService.selectUserExMerchantList(userExMerchant);
        return getDataTable(list);
    }

    /**
     * 查询全部可用商户列表
     * @param userExMerchant
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:list')")
    @GetMapping("/allList")
    public AjaxResult allList(UserExMerchant userExMerchant)
    {
        AjaxResult ajaxResult = AjaxResult.success();
        SysRole sysRole = getLoginUser().getUser().getRole();
        if(sysRole.getRoleKey().equals(RoleKey.manage.getValue()) || sysRole.getRoleKey().equals(RoleKey.admin.getValue())){
            //总管理员角色&超级管理员

        }else if(sysRole.getRoleKey().equals(RoleKey.part_manage.getValue())){
            //分管理员角色
            userExMerchant.setCreateById(getUserId());
        }
        userExMerchant.setStatus(3L);
        List<UserExMerchant> list = userExMerchantService.selectUserExMerchantList(userExMerchant);
        ajaxResult.put("data", list);
        return ajaxResult;
    }

    /**
     * 导出商户列表
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:export')")
    @Log(title = "商户", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, UserExMerchant userExMerchant)
    {
        List<UserExMerchant> list = userExMerchantService.selectUserExMerchantList(userExMerchant);
        ExcelUtil<UserExMerchant> util = new ExcelUtil<UserExMerchant>(UserExMerchant.class);
        util.exportExcel(response, list, "商户数据");
    }

    /**
     * 获取商户详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(userExMerchantService.selectUserExMerchantById(id));
    }

    /**
     * 新增商户
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:add')")
    @Log(title = "商户", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody UserExMerchant userExMerchant)
    {
        SysUser sysUser = new SysUser();
        sysUser.setUserName(userExMerchant.getUserName());
        sysUser.setPassword(SecurityUtils.encryptPassword(userExMerchant.getPassword()));
        sysUser.setLegalName(userExMerchant.getLegalName());
        sysUser.setStatus(UserStatus.DISABLE.getCode());
        sysUser.setPhonenumber(userExMerchant.getPhonenumber());
        sysUser.setEmail(userExMerchant.getEmail());
        sysUser.setIsMerchant(1);
        //先校验登录用户名是否存在
        if (!iSysUserService.checkUserNameUnique(sysUser))
        {
            return error("登录账号"+sysUser.getUserName()+"已存在");
        }
        else if (StringUtils.isNotEmpty(sysUser.getPhonenumber()) && !iSysUserService.checkPhoneUnique(sysUser))
        {
            return error("新增用户'" + sysUser.getUserName() + "'失败，手机号码已存在");
        }
        else if (StringUtils.isNotEmpty(sysUser.getEmail()) && !iSysUserService.checkEmailUnique(sysUser))
        {
            return error("新增用户'" + sysUser.getUserName() + "'失败，邮箱账号已存在");
        }
        int count = iSysUserService.insertUser(sysUser);
        if(count <= 0){
            AjaxResult ajaxResult = AjaxResult.error();
            ajaxResult.put("msg", "创建商家失败");
            return ajaxResult;
        }
        userExMerchant.setUserId(sysUser.getUserId());
        userExMerchant.setCreateById(getUserId());
        userExMerchant.setCreateByName(getLoginUser().getUser().getLegalName());
        return toAjax(userExMerchantService.insertUserExMerchant(userExMerchant));
    }

    /**
     * 修改商户
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:edit')")
    @Log(title = "商户", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody UserExMerchant userExMerchant)
    {
        if(null != userExMerchant.getUserId()){
            SysUser sysUser = new SysUser();
            sysUser.setUserName(userExMerchant.getUserName());
            //sysUser.setPassword(SecurityUtils.encryptPassword(userExMerchant.getPassword()));
            sysUser.setLegalName(userExMerchant.getLegalName());
            sysUser.setPhonenumber(userExMerchant.getPhonenumber());
            sysUser.setEmail(userExMerchant.getEmail());
            sysUser.setUserId(userExMerchant.getUserId());
            //先校验登录用户名是否存在
            if (!iSysUserService.checkUserNameUnique(sysUser))
            {
                return error("登录账号"+sysUser.getUserName()+"已存在");
            }
            else if (StringUtils.isNotEmpty(sysUser.getPhonenumber()) && !iSysUserService.checkPhoneUnique(sysUser))
            {
                return error("新增用户'" + sysUser.getUserName() + "'失败，手机号码已存在");
            }
            else if (StringUtils.isNotEmpty(sysUser.getEmail()) && !iSysUserService.checkEmailUnique(sysUser))
            {
                return error("新增用户'" + sysUser.getUserName() + "'失败，邮箱账号已存在");
            }
            int count = iSysUserService.updateUser(sysUser);
            if(count <= 0){
                AjaxResult ajaxResult = AjaxResult.error();
                ajaxResult.put("msg", "更新商家失败");
                return ajaxResult;
            }
        }
        return toAjax(userExMerchantService.updateUserExMerchant(userExMerchant));
    }

    /**
     * 删除商户
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:remove')")
    @Log(title = "商户", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(userExMerchantService.deleteUserExMerchantByIds(ids));
    }

    /**
     * 审核
     * @param userExMerchant
     * @return
     */
    @PreAuthorize("@ss.hasPermi('system:merchant:audit')")
    @Log(title = "商户", businessType = BusinessType.UPDATE)
    @PostMapping("/audit")
    public AjaxResult audit(@RequestBody UserExMerchant userExMerchant)
    {
        UserExMerchantAuditLog userExMerchantAuditLog = null;
        if(null != userExMerchant.getId()){
            userExMerchantAuditLog = new UserExMerchantAuditLog();
            userExMerchantAuditLog.setMerchantId(userExMerchant.getId());
            userExMerchantAuditLog.setOperatStatus(userExMerchant.getStatus());
            if(userExMerchant.getStatus() == 3){
                userExMerchantAuditLog.setOperatName("审核通过");
                SysUser sysUser = new SysUser();
                sysUser.setUserId(userExMerchant.getUserId());
                sysUser.setStatus(UserStatus.OK.getCode());
                iSysUserService.updateUserStatus(sysUser);
            }else if(userExMerchant.getStatus() == 2){
                userExMerchantAuditLog.setOperatName("审核拒绝");
                userExMerchantAuditLog.setOperateRemark(userExMerchant.getReason());
            }
            userExMerchantAuditLog.setOperateByUserId(getUserId());
            userExMerchantAuditLog.setOperateByName(getLoginUser().getUser().getLegalName());
        }
        return toAjax(userExMerchantService.auditUserExMerchant(userExMerchant, userExMerchantAuditLog));
    }
}
