package com.ruoyi.system.service.impl;

import java.util.ArrayList;
import java.util.List;

import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.service.IUserExMerchantService;

/**
 * 商户Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-09-10
 */
@Service
public class UserExMerchantServiceImpl implements IUserExMerchantService 
{
    @Autowired
    private UserExMerchantMapper userExMerchantMapper;

    @Autowired
    private UserExMerchantAuditLogMapper userExMerchantAuditLogMapper;

    @Autowired
    private SysRoleMapper roleMapper;

    @Autowired
    private SysUserRoleMapper userRoleMapper;

    @Autowired
    private SysUserMapper userMapper;

    /**
     * 查询商户
     * 
     * @param id 商户主键
     * @return 商户
     */
    @Override
    public UserExMerchant selectUserExMerchantById(Long id)
    {
        return userExMerchantMapper.selectUserExMerchantById(id);
    }

    /**
     * 查询商户
     *
     * @param userId
     * @return 商户
     */
    public UserExMerchant selectUserExMerchantByUserId(Long userId){
        return userExMerchantMapper.selectUserExMerchantByUserId(userId);
    }

    /**
     * 查询商户列表
     * 
     * @param userExMerchant 商户
     * @return 商户
     */
    @Override
    public List<UserExMerchant> selectUserExMerchantList(UserExMerchant userExMerchant)
    {
        return userExMerchantMapper.selectUserExMerchantList(userExMerchant);
    }

    /**
     * 新增商户
     * 
     * @param userExMerchant 商户
     * @return 结果
     */
    @Override
    public int insertUserExMerchant(UserExMerchant userExMerchant)
    {
        //关联商户角色
        SysRole sysRole = new SysRole();
        sysRole.setRoleKey(RoleKey.merchant.getValue());
        SysRole sysRoleDTO = roleMapper.selectRoleByCon(sysRole);
        if(null != sysRoleDTO){
            SysUserRole sysUserRole = new SysUserRole();
            sysUserRole.setUserId(userExMerchant.getUserId());
            sysUserRole.setRoleId(sysRoleDTO.getRoleId());
            List<SysUserRole> sysUserRoleList = new ArrayList<>();
            sysUserRoleList.add(sysUserRole);
            userRoleMapper.batchUserRole(sysUserRoleList);
        }
        userExMerchant.setCreateTime(DateUtils.getNowDate());
        return userExMerchantMapper.insertUserExMerchant(userExMerchant);
    }

    /**
     * 修改商户
     * 
     * @param userExMerchant 商户
     * @return 结果
     */
    @Override
    public int updateUserExMerchant(UserExMerchant userExMerchant)
    {
        userExMerchant.setUpdateTime(DateUtils.getNowDate());
        return userExMerchantMapper.updateUserExMerchant(userExMerchant);
    }

    /**
     * 审核商户
     *
     * @param userExMerchant 商户
     * @return 结果
     */
    public int auditUserExMerchant(UserExMerchant userExMerchant, UserExMerchantAuditLog userExMerchantAuditLog)
    {
        int count = 0;
        userExMerchant.setUpdateTime(DateUtils.getNowDate());
        count = userExMerchantMapper.updateUserExMerchant(userExMerchant);
        if(count > 0){
            userExMerchantAuditLog.setOperateTime(DateUtils.getNowDate());
            userExMerchantAuditLogMapper.insertUserExMerchantAuditLog(userExMerchantAuditLog);
        }
        return count;
    }

    /**
     * 批量删除商户
     * 
     * @param ids 需要删除的商户主键
     * @return 结果
     */
    @Override
    public int deleteUserExMerchantByIds(Long[] ids)
    {
        for(int i = 0;i < ids.length; i++){
            UserExMerchant userExMerchant = userExMerchantMapper.selectUserExMerchantById(ids[i]);
            if(null != userExMerchant && null != userExMerchant.getUserId()){
                userMapper.deleteUserById(userExMerchant.getUserId());
            }
        }
        return userExMerchantMapper.deleteUserExMerchantByIds(ids);
    }

    /**
     * 删除商户信息
     * 
     * @param id 商户主键
     * @return 结果
     */
    @Override
    public int deleteUserExMerchantById(Long id)
    {
        return userExMerchantMapper.deleteUserExMerchantById(id);
    }
}
