/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.entity.SysUser
 */
package com.ruoyi.system.service;

import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.system.domain.UserExtendsData;
import java.util.List;

public interface ISysUserService {
    public List<SysUser> selectUserList(SysUser var1);

    public List<SysUser> selectUserListForApp(SysUser var1);

    public List<SysUser> selectAllocatedList(SysUser var1);

    public List<SysUser> selectUnallocatedList(SysUser var1);

    public SysUser selectUserByUserName(String var1);

    public SysUser selectUserById(Long var1);

    public SysUser selectUserByPhoneNumber(String var1);

    public String selectUserRoleGroup(String var1);

    public String selectUserPostGroup(String var1);

    public UserExtendsData selectUserLevelAndPoints(UserExtendsData var1);

    public boolean checkUserNameUnique(SysUser var1);

    public boolean checkPhoneUnique(SysUser var1);

    public boolean checkEmailUnique(SysUser var1);

    public void checkUserAllowed(SysUser var1);

    public void checkUserDataScope(Long var1);

    public int insertUser(SysUser var1);

    public boolean registerUser(SysUser var1);

    public int updateUser(SysUser var1);

    public void insertUserAuth(Long var1, Long[] var2);

    public int updateUserVerifyEmail(SysUser var1);

    public int updateUserStatus(SysUser var1);

    public int updateUserProfile(SysUser var1);

    public boolean updateUserAvatar(Long var1, String var2);

    public int resetPwd(SysUser var1);

    public int resetUserPwd(Long var1, String var2);

    public int resetUserPwdByPhoneNumber(String var1, String var2);

    public int deleteUserById(Long var1);

    public int deleteUserByIds(Long[] var1);

    public String importUser(List<SysUser> var1, Boolean var2, String var3);
}

