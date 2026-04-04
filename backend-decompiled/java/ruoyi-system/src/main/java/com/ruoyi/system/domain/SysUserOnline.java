/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.domain;

public class SysUserOnline {
    private String tokenId;
    private String deptName;
    private String userName;
    private String ipaddr;
    private String loginLocation;
    private String browser;
    private String os;
    private Long loginTime;

    public String getTokenId() {
        return this.tokenId;
    }

    public void setTokenId(String tokenId) {
        this.tokenId = tokenId;
    }

    public String getDeptName() {
        return this.deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public String getUserName() {
        return this.userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
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

    public Long getLoginTime() {
        return this.loginTime;
    }

    public void setLoginTime(Long loginTime) {
        this.loginTime = loginTime;
    }
}

