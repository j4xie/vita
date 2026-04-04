/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.model.LoginUser
 *  com.ruoyi.common.utils.StringUtils
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.domain.SysUserOnline;
import com.ruoyi.system.service.ISysUserOnlineService;
import org.springframework.stereotype.Service;

@Service
public class SysUserOnlineServiceImpl
implements ISysUserOnlineService {
    @Override
    public SysUserOnline selectOnlineByIpaddr(String ipaddr, LoginUser user) {
        if (StringUtils.equals((CharSequence)ipaddr, (CharSequence)user.getIpaddr())) {
            return this.loginUserToUserOnline(user);
        }
        return null;
    }

    @Override
    public SysUserOnline selectOnlineByUserName(String userName, LoginUser user) {
        if (StringUtils.equals((CharSequence)userName, (CharSequence)user.getUsername())) {
            return this.loginUserToUserOnline(user);
        }
        return null;
    }

    @Override
    public SysUserOnline selectOnlineByInfo(String ipaddr, String userName, LoginUser user) {
        if (StringUtils.equals((CharSequence)ipaddr, (CharSequence)user.getIpaddr()) && StringUtils.equals((CharSequence)userName, (CharSequence)user.getUsername())) {
            return this.loginUserToUserOnline(user);
        }
        return null;
    }

    @Override
    public SysUserOnline loginUserToUserOnline(LoginUser user) {
        if (StringUtils.isNull((Object)user) || StringUtils.isNull((Object)user.getUser())) {
            return null;
        }
        SysUserOnline sysUserOnline = new SysUserOnline();
        sysUserOnline.setTokenId(user.getToken());
        sysUserOnline.setUserName(user.getUsername());
        sysUserOnline.setIpaddr(user.getIpaddr());
        sysUserOnline.setLoginLocation(user.getLoginLocation());
        sysUserOnline.setBrowser(user.getBrowser());
        sysUserOnline.setOs(user.getOs());
        sysUserOnline.setLoginTime(user.getLoginTime());
        if (StringUtils.isNotNull((Object)user.getUser().getDept())) {
            sysUserOnline.setDeptName(user.getUser().getDept().getDeptName());
        }
        return sysUserOnline;
    }
}

