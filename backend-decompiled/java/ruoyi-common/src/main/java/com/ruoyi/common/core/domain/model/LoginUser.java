/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alibaba.fastjson2.annotation.JSONField
 *  org.springframework.security.core.GrantedAuthority
 *  org.springframework.security.core.userdetails.UserDetails
 */
package com.ruoyi.common.core.domain.model;

import com.alibaba.fastjson2.annotation.JSONField;
import com.ruoyi.common.core.domain.entity.SysUser;
import java.util.Collection;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class LoginUser
implements UserDetails {
    private static final long serialVersionUID = 1L;
    private Long userId;
    private Long deptId;
    private String token;
    private Long loginTime;
    private Long expireTime;
    private String ipaddr;
    private String loginLocation;
    private String browser;
    private String os;
    private Set<String> permissions;
    private SysUser user;

    public LoginUser() {
    }

    public LoginUser(SysUser user, Set<String> permissions) {
        this.user = user;
        this.permissions = permissions;
    }

    public LoginUser(Long userId, Long deptId, SysUser user, Set<String> permissions) {
        this.userId = userId;
        this.deptId = deptId;
        this.user = user;
        this.permissions = permissions;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getDeptId() {
        return this.deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public String getToken() {
        return this.token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    @JSONField(serialize=false)
    public String getPassword() {
        return this.user.getPassword();
    }

    public String getUsername() {
        return this.user.getUserName();
    }

    @JSONField(serialize=false)
    public boolean isAccountNonExpired() {
        return true;
    }

    @JSONField(serialize=false)
    public boolean isAccountNonLocked() {
        return true;
    }

    @JSONField(serialize=false)
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @JSONField(serialize=false)
    public boolean isEnabled() {
        return true;
    }

    public Long getLoginTime() {
        return this.loginTime;
    }

    public void setLoginTime(Long loginTime) {
        this.loginTime = loginTime;
    }

    public String getIpaddr() {
        return this.ipaddr;
    }

    public void setIpaddr(String ipaddr) {
        this.ipaddr = ipaddr;
    }

    public String getLoginLocation() {
        return this.loginLocation;
    }

    public void setLoginLocation(String loginLocation) {
        this.loginLocation = loginLocation;
    }

    public String getBrowser() {
        return this.browser;
    }

    public void setBrowser(String browser) {
        this.browser = browser;
    }

    public String getOs() {
        return this.os;
    }

    public void setOs(String os) {
        this.os = os;
    }

    public Long getExpireTime() {
        return this.expireTime;
    }

    public void setExpireTime(Long expireTime) {
        this.expireTime = expireTime;
    }

    public Set<String> getPermissions() {
        return this.permissions;
    }

    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }

    public SysUser getUser() {
        return this.user;
    }

    public void setUser(SysUser user) {
        this.user = user;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }
}

