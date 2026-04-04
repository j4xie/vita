/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.DataScope
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.exception.ServiceException
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.spring.SpringUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 *  org.springframework.transaction.annotation.Transactional
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.annotation.DataScope;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.spring.SpringUtils;
import com.ruoyi.system.domain.SysRoleDept;
import com.ruoyi.system.domain.SysRoleMenu;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.mapper.SysRoleDeptMapper;
import com.ruoyi.system.mapper.SysRoleMapper;
import com.ruoyi.system.mapper.SysRoleMenuMapper;
import com.ruoyi.system.mapper.SysUserRoleMapper;
import com.ruoyi.system.service.ISysRoleService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SysRoleServiceImpl
implements ISysRoleService {
    @Autowired
    private SysRoleMapper roleMapper;
    @Autowired
    private SysRoleMenuMapper roleMenuMapper;
    @Autowired
    private SysUserRoleMapper userRoleMapper;
    @Autowired
    private SysRoleDeptMapper roleDeptMapper;

    @Override
    @DataScope(deptAlias="d")
    public List<SysRole> selectRoleList(SysRole role) {
        return this.roleMapper.selectRoleList(role);
    }

    @Override
    public SysRole selectRoleByCon(SysRole role) {
        return this.roleMapper.selectRoleByCon(role);
    }

    @Override
    public List<SysRole> selectRolesByUserId(Long userId) {
        List<SysRole> userRoles = this.roleMapper.selectRolePermissionByUserId(userId);
        List<SysRole> roles = this.selectRoleAll();
        block0: for (SysRole role : roles) {
            for (SysRole userRole : userRoles) {
                if (role.getRoleId().longValue() != userRole.getRoleId().longValue()) continue;
                role.setFlag(true);
                continue block0;
            }
        }
        return roles;
    }

    @Override
    public Set<String> selectRolePermissionByUserId(Long userId) {
        List<SysRole> perms = this.roleMapper.selectRolePermissionByUserId(userId);
        HashSet<String> permsSet = new HashSet<String>();
        for (SysRole perm : perms) {
            if (!StringUtils.isNotNull((Object)perm)) continue;
            permsSet.addAll(Arrays.asList(perm.getRoleKey().trim().split(",")));
        }
        return permsSet;
    }

    @Override
    public List<SysRole> selectRoleAll() {
        return ((SysRoleServiceImpl)SpringUtils.getAopProxy((Object)this)).selectRoleList(new SysRole());
    }

    @Override
    public List<Long> selectRoleListByUserId(Long userId) {
        return this.roleMapper.selectRoleListByUserId(userId);
    }

    @Override
    public SysRole selectRoleById(Long roleId) {
        return this.roleMapper.selectRoleById(roleId);
    }

    @Override
    public boolean checkRoleNameUnique(SysRole role) {
        Long roleId = StringUtils.isNull((Object)role.getRoleId()) ? -1L : role.getRoleId();
        SysRole info = this.roleMapper.checkRoleNameUnique(role.getRoleName());
        return !StringUtils.isNotNull((Object)info) || info.getRoleId().longValue() == roleId.longValue();
    }

    @Override
    public boolean checkRoleKeyUnique(SysRole role) {
        Long roleId = StringUtils.isNull((Object)role.getRoleId()) ? -1L : role.getRoleId();
        SysRole info = this.roleMapper.checkRoleKeyUnique(role.getRoleKey());
        return !StringUtils.isNotNull((Object)info) || info.getRoleId().longValue() == roleId.longValue();
    }

    @Override
    public void checkRoleAllowed(SysRole role) {
        if (StringUtils.isNotNull((Object)role.getRoleId()) && role.isAdmin()) {
            throw new ServiceException("\u4e0d\u5141\u8bb8\u64cd\u4f5c\u8d85\u7ea7\u7ba1\u7406\u5458\u89d2\u8272");
        }
    }

    @Override
    public void checkRoleDataScope(Long ... roleIds) {
        if (!SysUser.isAdmin((Long)SecurityUtils.getUserId())) {
            for (Long roleId : roleIds) {
                SysRole role = new SysRole();
                role.setRoleId(roleId);
                List<SysRole> roles = ((SysRoleServiceImpl)SpringUtils.getAopProxy((Object)this)).selectRoleList(role);
                if (!StringUtils.isEmpty(roles)) continue;
                throw new ServiceException("\u6ca1\u6709\u6743\u9650\u8bbf\u95ee\u89d2\u8272\u6570\u636e\uff01");
            }
        }
    }

    @Override
    public int countUserRoleByRoleId(Long roleId) {
        return this.userRoleMapper.countUserRoleByRoleId(roleId);
    }

    @Override
    @Transactional
    public int insertRole(SysRole role) {
        this.roleMapper.insertRole(role);
        return this.insertRoleMenu(role);
    }

    @Override
    @Transactional
    public int updateRole(SysRole role) {
        this.roleMapper.updateRole(role);
        this.roleMenuMapper.deleteRoleMenuByRoleId(role.getRoleId());
        return this.insertRoleMenu(role);
    }

    @Override
    public int updateRoleStatus(SysRole role) {
        return this.roleMapper.updateRole(role);
    }

    @Override
    @Transactional
    public int authDataScope(SysRole role) {
        this.roleMapper.updateRole(role);
        this.roleDeptMapper.deleteRoleDeptByRoleId(role.getRoleId());
        return this.insertRoleDept(role);
    }

    public int insertRoleMenu(SysRole role) {
        int rows = 1;
        ArrayList<SysRoleMenu> list = new ArrayList<SysRoleMenu>();
        for (Long menuId : role.getMenuIds()) {
            SysRoleMenu rm = new SysRoleMenu();
            rm.setRoleId(role.getRoleId());
            rm.setMenuId(menuId);
            list.add(rm);
        }
        if (list.size() > 0) {
            rows = this.roleMenuMapper.batchRoleMenu(list);
        }
        return rows;
    }

    public int insertRoleDept(SysRole role) {
        int rows = 1;
        ArrayList<SysRoleDept> list = new ArrayList<SysRoleDept>();
        for (Long deptId : role.getDeptIds()) {
            SysRoleDept rd = new SysRoleDept();
            rd.setRoleId(role.getRoleId());
            rd.setDeptId(deptId);
            list.add(rd);
        }
        if (list.size() > 0) {
            rows = this.roleDeptMapper.batchRoleDept(list);
        }
        return rows;
    }

    @Override
    @Transactional
    public int deleteRoleById(Long roleId) {
        this.roleMenuMapper.deleteRoleMenuByRoleId(roleId);
        this.roleDeptMapper.deleteRoleDeptByRoleId(roleId);
        return this.roleMapper.deleteRoleById(roleId);
    }

    @Override
    @Transactional
    public int deleteRoleByIds(Long[] roleIds) {
        for (Long roleId : roleIds) {
            this.checkRoleAllowed(new SysRole(roleId));
            this.checkRoleDataScope(roleId);
            SysRole role = this.selectRoleById(roleId);
            if (this.countUserRoleByRoleId(roleId) <= 0) continue;
            throw new ServiceException(String.format("%1$s\u5df2\u5206\u914d,\u4e0d\u80fd\u5220\u9664", role.getRoleName()));
        }
        this.roleMenuMapper.deleteRoleMenu(roleIds);
        this.roleDeptMapper.deleteRoleDept(roleIds);
        return this.roleMapper.deleteRoleByIds(roleIds);
    }

    @Override
    public int deleteAuthUser(SysUserRole userRole) {
        return this.userRoleMapper.deleteUserRoleInfo(userRole);
    }

    @Override
    public int deleteAuthUsers(Long roleId, Long[] userIds) {
        return this.userRoleMapper.deleteUserRoleInfos(roleId, userIds);
    }

    @Override
    public int insertAuthUsers(Long roleId, Long[] userIds) {
        ArrayList<SysUserRole> list = new ArrayList<SysUserRole>();
        for (Long userId : userIds) {
            List<Long> _list = this.roleMapper.selectRoleListByUserId(userId);
            if (!_list.isEmpty() && _list.size() > 0) {
                this.userRoleMapper.deleteUserRoleByUserId(userId);
            }
            SysUserRole ur = new SysUserRole();
            ur.setUserId(userId);
            ur.setRoleId(roleId);
            list.add(ur);
        }
        return this.userRoleMapper.batchUserRole(list);
    }
}

