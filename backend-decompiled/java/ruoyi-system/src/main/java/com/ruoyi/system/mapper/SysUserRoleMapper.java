/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.ibatis.annotations.Param
 */
package com.ruoyi.system.mapper;

import com.ruoyi.system.domain.SysUserRole;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface SysUserRoleMapper {
    public int deleteUserRoleByUserId(Long var1);

    public int deleteUserRole(Long[] var1);

    public int countUserRoleByRoleId(Long var1);

    public int batchUserRole(List<SysUserRole> var1);

    public int deleteUserRoleInfo(SysUserRole var1);

    public int deleteUserRoleInfos(@Param(value="roleId") Long var1, @Param(value="userIds") Long[] var2);
}

