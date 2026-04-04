/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.enums.RoleKey
 *  com.ruoyi.common.utils.DateUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.enums.RoleKey;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.domain.UserExMerchant;
import com.ruoyi.system.domain.UserExMerchantAuditLog;
import com.ruoyi.system.mapper.SysRoleMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import com.ruoyi.system.mapper.SysUserRoleMapper;
import com.ruoyi.system.mapper.UserExMerchantAuditLogMapper;
import com.ruoyi.system.mapper.UserExMerchantMapper;
import com.ruoyi.system.service.IUserExMerchantService;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserExMerchantServiceImpl
implements IUserExMerchantService {
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

    @Override
    public UserExMerchant selectUserExMerchantById(Long id) {
        return this.userExMerchantMapper.selectUserExMerchantById(id);
    }

    @Override
    public UserExMerchant selectUserExMerchantByUserId(Long userId) {
        return this.userExMerchantMapper.selectUserExMerchantByUserId(userId);
    }

    @Override
    public List<UserExMerchant> selectUserExMerchantList(UserExMerchant userExMerchant) {
        return this.userExMerchantMapper.selectUserExMerchantList(userExMerchant);
    }

    @Override
    public int insertUserExMerchant(UserExMerchant userExMerchant) {
        SysRole sysRole = new SysRole();
        sysRole.setRoleKey(RoleKey.merchant.getValue());
        SysRole sysRoleDTO = this.roleMapper.selectRoleByCon(sysRole);
        if (null != sysRoleDTO) {
            SysUserRole sysUserRole = new SysUserRole();
            sysUserRole.setUserId(userExMerchant.getUserId());
            sysUserRole.setRoleId(sysRoleDTO.getRoleId());
            ArrayList<SysUserRole> sysUserRoleList = new ArrayList<SysUserRole>();
            sysUserRoleList.add(sysUserRole);
            this.userRoleMapper.batchUserRole(sysUserRoleList);
        }
        userExMerchant.setCreateTime(DateUtils.getNowDate());
        return this.userExMerchantMapper.insertUserExMerchant(userExMerchant);
    }

    @Override
    public int updateUserExMerchant(UserExMerchant userExMerchant) {
        userExMerchant.setUpdateTime(DateUtils.getNowDate());
        return this.userExMerchantMapper.updateUserExMerchant(userExMerchant);
    }

    @Override
    public int auditUserExMerchant(UserExMerchant userExMerchant, UserExMerchantAuditLog userExMerchantAuditLog) {
        int count = 0;
        userExMerchant.setUpdateTime(DateUtils.getNowDate());
        count = this.userExMerchantMapper.updateUserExMerchant(userExMerchant);
        if (count > 0) {
            userExMerchantAuditLog.setOperateTime(DateUtils.getNowDate());
            this.userExMerchantAuditLogMapper.insertUserExMerchantAuditLog(userExMerchantAuditLog);
        }
        return count;
    }

    @Override
    public int deleteUserExMerchantByIds(Long[] ids) {
        for (int i = 0; i < ids.length; ++i) {
            UserExMerchant userExMerchant = this.userExMerchantMapper.selectUserExMerchantById(ids[i]);
            if (null == userExMerchant || null == userExMerchant.getUserId()) continue;
            this.userMapper.deleteUserById(userExMerchant.getUserId());
        }
        return this.userExMerchantMapper.deleteUserExMerchantByIds(ids);
    }

    @Override
    public int deleteUserExMerchantById(Long id) {
        return this.userExMerchantMapper.deleteUserExMerchantById(id);
    }
}

