/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.DataScope
 *  com.ruoyi.common.core.domain.entity.SysDept
 *  com.ruoyi.common.core.domain.entity.SysPost
 *  com.ruoyi.common.core.domain.entity.SysRole
 *  com.ruoyi.common.core.domain.entity.SysUser
 *  com.ruoyi.common.core.domain.entity.UserExtendsDataLog
 *  com.ruoyi.common.exception.ServiceException
 *  com.ruoyi.common.utils.SecurityUtils
 *  com.ruoyi.common.utils.StringUtils
 *  com.ruoyi.common.utils.bean.BeanValidators
 *  com.ruoyi.common.utils.spring.SpringUtils
 *  javax.validation.Validator
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.stereotype.Service
 *  org.springframework.transaction.annotation.Transactional
 *  org.springframework.util.CollectionUtils
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.annotation.DataScope;
import com.ruoyi.common.core.domain.entity.SysDept;
import com.ruoyi.common.core.domain.entity.SysPost;
import com.ruoyi.common.core.domain.entity.SysRole;
import com.ruoyi.common.core.domain.entity.SysUser;
import com.ruoyi.common.core.domain.entity.UserExtendsDataLog;
import com.ruoyi.common.exception.ServiceException;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.bean.BeanValidators;
import com.ruoyi.common.utils.spring.SpringUtils;
import com.ruoyi.system.domain.SysUserPost;
import com.ruoyi.system.domain.SysUserRole;
import com.ruoyi.system.domain.UserExtendsData;
import com.ruoyi.system.mapper.SysPostMapper;
import com.ruoyi.system.mapper.SysRoleMapper;
import com.ruoyi.system.mapper.SysUserMapper;
import com.ruoyi.system.mapper.SysUserPostMapper;
import com.ruoyi.system.mapper.SysUserRoleMapper;
import com.ruoyi.system.mapper.UserExtendsDataLogMapper;
import com.ruoyi.system.service.ISysConfigService;
import com.ruoyi.system.service.ISysDeptService;
import com.ruoyi.system.service.ISysUserService;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import javax.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

@Service
public class SysUserServiceImpl
implements ISysUserService {
    private static final Logger log = LoggerFactory.getLogger(SysUserServiceImpl.class);
    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysRoleMapper roleMapper;
    @Autowired
    private SysPostMapper postMapper;
    @Autowired
    private SysUserRoleMapper userRoleMapper;
    @Autowired
    private SysUserPostMapper userPostMapper;
    @Autowired
    private ISysConfigService configService;
    @Autowired
    private ISysDeptService deptService;
    @Autowired
    protected Validator validator;
    @Autowired
    private UserExtendsDataLogMapper userExtendsDataLogMapper;

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<SysUser> selectUserList(SysUser user) {
        List<SysUser> list = this.userMapper.selectUserList(user);
        for (int i = 0; i < list.size(); ++i) {
            SysDept sysDept;
            if (null != list.get(i).getDept() && null != list.get(i).getDept().getParentId() && list.get(i).getDept().getParentId() > 1L && null != (sysDept = this.deptService.selectDeptById(list.get(i).getDept().getParentId()))) {
                sysDept.setChildrenDept(list.get(i).getDept());
                list.get(i).setDept(sysDept);
            }
            List<UserExtendsDataLog> userExtendsDataLogList = this.userExtendsDataLogMapper.selectUserExtendsDataLogByUserId(list.get(i).getUserId());
            list.get(i).setUserExtendsDataLogList(userExtendsDataLogList);
        }
        return list;
    }

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<SysUser> selectUserListForApp(SysUser sysUser) {
        List<SysUser> list = this.userMapper.selectUserListForApp(sysUser);
        for (int i = 0; i < list.size(); ++i) {
            SysDept sysDept;
            if (null == list.get(i).getDept() || null == list.get(i).getDept().getParentId() || list.get(i).getDept().getParentId() <= 1L || null == (sysDept = this.deptService.selectDeptById(list.get(i).getDept().getParentId()))) continue;
            sysDept.setChildrenDept(list.get(i).getDept());
            list.get(i).setDept(sysDept);
        }
        return list;
    }

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<SysUser> selectAllocatedList(SysUser user) {
        return this.userMapper.selectAllocatedList(user);
    }

    @Override
    @DataScope(deptAlias="d", userAlias="u")
    public List<SysUser> selectUnallocatedList(SysUser user) {
        return this.userMapper.selectUnallocatedList(user);
    }

    @Override
    public SysUser selectUserByUserName(String userName) {
        return this.userMapper.selectUserByUserName(userName);
    }

    @Override
    public SysUser selectUserById(Long userId) {
        return this.userMapper.selectUserById(userId);
    }

    @Override
    public SysUser selectUserByPhoneNumber(String phonenumber) {
        return this.userMapper.selectUserByPhoneNumber(phonenumber);
    }

    @Override
    public String selectUserRoleGroup(String userName) {
        List<SysRole> list = this.roleMapper.selectRolesByUserName(userName);
        if (CollectionUtils.isEmpty(list)) {
            return "";
        }
        return list.stream().map(SysRole::getRoleName).collect(Collectors.joining(","));
    }

    @Override
    public String selectUserPostGroup(String userName) {
        List<SysPost> list = this.postMapper.selectPostsByUserName(userName);
        if (CollectionUtils.isEmpty(list)) {
            return "";
        }
        return list.stream().map(SysPost::getPostName).collect(Collectors.joining(","));
    }

    @Override
    public UserExtendsData selectUserLevelAndPoints(UserExtendsData userExtendsData) {
        return this.userMapper.selectUserLevelAndPoints(userExtendsData);
    }

    @Override
    public boolean checkUserNameUnique(SysUser user) {
        Long userId = StringUtils.isNull((Object)user.getUserId()) ? -1L : user.getUserId();
        SysUser info = this.userMapper.checkUserNameUnique(user.getUserName());
        return !StringUtils.isNotNull((Object)info) || info.getUserId().longValue() == userId.longValue();
    }

    @Override
    public boolean checkPhoneUnique(SysUser user) {
        Long userId = StringUtils.isNull((Object)user.getUserId()) ? -1L : user.getUserId();
        SysUser info = this.userMapper.checkPhoneUnique(user.getPhonenumber());
        return !StringUtils.isNotNull((Object)info) || info.getUserId().longValue() == userId.longValue();
    }

    @Override
    public boolean checkEmailUnique(SysUser user) {
        Long userId = StringUtils.isNull((Object)user.getUserId()) ? -1L : user.getUserId();
        SysUser info = this.userMapper.checkEmailUnique(user.getEmail());
        return !StringUtils.isNotNull((Object)info) || info.getUserId().longValue() == userId.longValue();
    }

    @Override
    public void checkUserAllowed(SysUser user) {
        if (StringUtils.isNotNull((Object)user.getUserId()) && user.isAdmin()) {
            throw new ServiceException("\u4e0d\u5141\u8bb8\u64cd\u4f5c\u8d85\u7ea7\u7ba1\u7406\u5458\u7528\u6237");
        }
    }

    @Override
    public void checkUserDataScope(Long userId) {
        if (!SysUser.isAdmin((Long)SecurityUtils.getUserId())) {
            SysUser user = new SysUser();
            user.setUserId(userId);
            List<SysUser> users = ((SysUserServiceImpl)SpringUtils.getAopProxy((Object)this)).selectUserList(user);
            if (StringUtils.isEmpty(users)) {
                throw new ServiceException("\u6ca1\u6709\u6743\u9650\u8bbf\u95ee\u7528\u6237\u6570\u636e\uff01");
            }
        }
    }

    @Override
    @Transactional
    public int insertUser(SysUser user) {
        int rows = this.userMapper.insertUser(user);
        this.insertUserPost(user);
        this.insertUserRole(user);
        return rows;
    }

    @Override
    public boolean registerUser(SysUser user) {
        return this.userMapper.insertUser(user) > 0;
    }

    @Override
    public int updateUserVerifyEmail(SysUser user) {
        return this.userMapper.updateUserVerifyEmail(user.getUserId(), user.getIsEmailVerify());
    }

    @Override
    @Transactional
    public int updateUser(SysUser user) {
        Long userId = user.getUserId();
        this.userRoleMapper.deleteUserRoleByUserId(userId);
        this.insertUserRole(user);
        this.userPostMapper.deleteUserPostByUserId(userId);
        this.insertUserPost(user);
        return this.userMapper.updateUser(user);
    }

    @Override
    @Transactional
    public void insertUserAuth(Long userId, Long[] roleIds) {
        this.userRoleMapper.deleteUserRoleByUserId(userId);
        this.insertUserRole(userId, roleIds);
    }

    @Override
    public int updateUserStatus(SysUser user) {
        return this.userMapper.updateUser(user);
    }

    @Override
    public int updateUserProfile(SysUser user) {
        return this.userMapper.updateUser(user);
    }

    @Override
    public boolean updateUserAvatar(Long userId, String avatar) {
        return this.userMapper.updateUserAvatar(userId, avatar) > 0;
    }

    @Override
    public int resetPwd(SysUser user) {
        return this.userMapper.updateUser(user);
    }

    @Override
    public int resetUserPwd(Long userId, String password) {
        return this.userMapper.resetUserPwd(userId, password);
    }

    @Override
    public int resetUserPwdByPhoneNumber(String phonenumber, String password) {
        return this.userMapper.resetUserPwdByPhoneNumber(phonenumber, password);
    }

    public void insertUserRole(SysUser user) {
        this.insertUserRole(user.getUserId(), user.getRoleIds());
    }

    public void insertUserPost(SysUser user) {
        Object[] posts = user.getPostIds();
        if (StringUtils.isNotEmpty((Object[])posts)) {
            ArrayList<SysUserPost> list = new ArrayList<SysUserPost>(posts.length);
            for (Object postId : posts) {
                SysUserPost up = new SysUserPost();
                up.setUserId(user.getUserId());
                up.setPostId((Long)postId);
                list.add(up);
            }
            this.userPostMapper.batchUserPost(list);
        }
    }

    public void insertUserRole(Long userId, Long[] roleIds) {
        if (StringUtils.isNotEmpty((Object[])roleIds)) {
            ArrayList<SysUserRole> list = new ArrayList<SysUserRole>(roleIds.length);
            for (Long roleId : roleIds) {
                SysUserRole ur = new SysUserRole();
                ur.setUserId(userId);
                ur.setRoleId(roleId);
                list.add(ur);
            }
            this.userRoleMapper.batchUserRole(list);
        }
    }

    @Override
    @Transactional
    public int deleteUserById(Long userId) {
        this.userRoleMapper.deleteUserRoleByUserId(userId);
        this.userPostMapper.deleteUserPostByUserId(userId);
        return this.userMapper.deleteUserById(userId);
    }

    @Override
    @Transactional
    public int deleteUserByIds(Long[] userIds) {
        for (Long userId : userIds) {
            this.checkUserAllowed(new SysUser(userId));
            this.checkUserDataScope(userId);
        }
        this.userRoleMapper.deleteUserRole(userIds);
        this.userPostMapper.deleteUserPost(userIds);
        return this.userMapper.deleteUserByIds(userIds);
    }

    @Override
    public String importUser(List<SysUser> userList, Boolean isUpdateSupport, String operName) {
        if (StringUtils.isNull(userList) || userList.size() == 0) {
            throw new ServiceException("\u5bfc\u5165\u7528\u6237\u6570\u636e\u4e0d\u80fd\u4e3a\u7a7a\uff01");
        }
        int successNum = 0;
        int failureNum = 0;
        StringBuilder successMsg = new StringBuilder();
        StringBuilder failureMsg = new StringBuilder();
        for (SysUser user : userList) {
            try {
                SysUser u = this.userMapper.selectUserByUserName(user.getUserName());
                if (StringUtils.isNull((Object)u)) {
                    BeanValidators.validateWithException((Validator)this.validator, (Object)user, (Class[])new Class[0]);
                    this.deptService.checkDeptDataScope(user.getDeptId());
                    String password = this.configService.selectConfigByKey("sys.user.initPassword");
                    user.setPassword(SecurityUtils.encryptPassword((String)password));
                    user.setCreateBy(operName);
                    this.userMapper.insertUser(user);
                    successMsg.append("<br/>" + ++successNum + "\u3001\u8d26\u53f7 " + user.getUserName() + " \u5bfc\u5165\u6210\u529f");
                    continue;
                }
                if (isUpdateSupport.booleanValue()) {
                    BeanValidators.validateWithException((Validator)this.validator, (Object)user, (Class[])new Class[0]);
                    this.checkUserAllowed(u);
                    this.checkUserDataScope(u.getUserId());
                    this.deptService.checkDeptDataScope(user.getDeptId());
                    user.setUserId(u.getUserId());
                    user.setUpdateBy(operName);
                    this.userMapper.updateUser(user);
                    successMsg.append("<br/>" + ++successNum + "\u3001\u8d26\u53f7 " + user.getUserName() + " \u66f4\u65b0\u6210\u529f");
                    continue;
                }
                failureMsg.append("<br/>" + ++failureNum + "\u3001\u8d26\u53f7 " + user.getUserName() + " \u5df2\u5b58\u5728");
            }
            catch (Exception e) {
                String msg = "<br/>" + ++failureNum + "\u3001\u8d26\u53f7 " + user.getUserName() + " \u5bfc\u5165\u5931\u8d25\uff1a";
                failureMsg.append(msg + e.getMessage());
                log.error(msg, (Throwable)e);
            }
        }
        if (failureNum > 0) {
            failureMsg.insert(0, "\u5f88\u62b1\u6b49\uff0c\u5bfc\u5165\u5931\u8d25\uff01\u5171 " + failureNum + " \u6761\u6570\u636e\u683c\u5f0f\u4e0d\u6b63\u786e\uff0c\u9519\u8bef\u5982\u4e0b\uff1a");
            throw new ServiceException(failureMsg.toString());
        }
        successMsg.insert(0, "\u606d\u559c\u60a8\uff0c\u6570\u636e\u5df2\u5168\u90e8\u5bfc\u5165\u6210\u529f\uff01\u5171 " + successNum + " \u6761\uff0c\u6570\u636e\u5982\u4e0b\uff1a");
        return successMsg.toString();
    }
}

