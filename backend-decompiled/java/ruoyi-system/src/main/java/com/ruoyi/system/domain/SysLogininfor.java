/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonFormat
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.annotation.Excel$ColumnType
 *  com.ruoyi.common.core.domain.BaseEntity
 */
package com.ruoyi.system.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import java.util.Date;

public class SysLogininfor
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u5e8f\u53f7", cellType=Excel.ColumnType.NUMERIC)
    private Long infoId;
    @Excel(name="\u7528\u6237\u8d26\u53f7")
    private String userName;
    @Excel(name="\u767b\u5f55\u72b6\u6001", readConverterExp="0=\u6210\u529f,1=\u5931\u8d25")
    private String status;
    @Excel(name="\u767b\u5f55\u5730\u5740")
    private String ipaddr;
    @Excel(name="\u767b\u5f55\u5730\u70b9")
    private String loginLocation;
    @Excel(name="\u6d4f\u89c8\u5668")
    private String browser;
    @Excel(name="\u64cd\u4f5c\u7cfb\u7edf")
    private String os;
    @Excel(name="\u63d0\u793a\u6d88\u606f")
    private String msg;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u8bbf\u95ee\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date loginTime;

    public Long getInfoId() {
        return this.infoId;
    }

    public void setInfoId(Long infoId) {
        this.infoId = infoId;
    }

    public String getUserName() {
        return this.userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getMsg() {
        return this.msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Date getLoginTime() {
        return this.loginTime;
    }

    public void setLoginTime(Date loginTime) {
        this.loginTime = loginTime;
    }
}

