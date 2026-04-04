/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  org.apache.ibatis.annotations.Param
 */
package com.ruoyi.system.mapper;

import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.system.domain.UserExtendsData;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface SysUserMapper {
    public List<SysUser> selectUserList(SysUser var1);

    public List<SysUser> selectUserListForApp(SysUser var1);

    public List<SysUser> selectAllocatedList(SysUser var1);

    public List<SysUser> selectUnallocatedList(SysUser var1);

    public SysUser selectUserByUserName(String var1);

    public SysUser selectUserByPhoneNumber(String var1);

    public SysUser selectUserById(Long var1);

    public UserExtendsData selectUserLevelAndPoints(UserExtendsData var1);

    public int insertUser(SysUser var1);

    public int updateUser(SysUser var1);

    public int updateUserVerifyEmail(@Param(value="userId") Long var1, @Param(value="isEmailVerify") Integer var2);

    public int updateUserAvatar(@Param(value="userId") Long var1, @Param(value="avatar") String var2);

    public int resetUserPwd(@Param(value="userId") Long var1, @Param(value="password") String var2);

    public int resetUserPwdByPhoneNumber(@Param(value="phonenumber") String var1, @Param(value="password") String var2);

    public int deleteUserById(Long var1);

    public int deleteUserByIds(Long[] var1);

    public SysUser checkUserNameUnique(String var1);

    public SysUser checkPhoneUnique(String var1);

    public SysUser checkEmailUnique(String var1);
}

