/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysRole
 */
package com.ruoyi.system.service;

import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.system.domain.SysUserRole;
import java.util.List;
import java.util.Set;

public interface ISysRoleService {
    public List<SysRole> selectRoleList(SysRole var1);

    public SysRole selectRoleByCon(SysRole var1);

    public List<SysRole> selectRolesByUserId(Long var1);

    public Set<String> selectRolePermissionByUserId(Long var1);

    public List<SysRole> selectRoleAll();

    public List<Long> selectRoleListByUserId(Long var1);

    public SysRole selectRoleById(Long var1);

    public boolean checkRoleNameUnique(SysRole var1);

    public boolean checkRoleKeyUnique(SysRole var1);

    public void checkRoleAllowed(SysRole var1);

    public void checkRoleDataScope(Long ... var1);

    public int countUserRoleByRoleId(Long var1);

    public int insertRole(SysRole var1);

    public int updateRole(SysRole var1);

    public int updateRoleStatus(SysRole var1);

    public int authDataScope(SysRole var1);

    public int deleteRoleById(Long var1);

    public int deleteRoleByIds(Long[] var1);

    public int deleteAuthUser(SysUserRole var1);

    public int deleteAuthUsers(Long var1, Long[] var2);

    public int insertAuthUsers(Long var1, Long[] var2);
}

