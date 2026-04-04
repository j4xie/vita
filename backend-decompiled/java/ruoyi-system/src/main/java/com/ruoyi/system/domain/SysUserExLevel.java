/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonFormat
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.system.domain.SysUserLevel;
import java.util.Date;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysUserExLevel
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u7528\u6237\u8868user_id")
    private Long userId;
    @Excel(name="\u4f1a\u5458\u7b49\u7ea7\u8868level_id")
    private Long levelId;
    @Excel(name="\u4f1a\u5458\u7b49\u7ea7\u65f6\u6548\u6027", readConverterExp="1=-\u6c38\u4e45,-=1-\u4e34\u65f6")
    private Long validityType;
    @Excel(name="\u72b6\u6001", readConverterExp="1=-\u6b63\u5e38,-=1-\u5931\u6548")
    private Long status;
    @JsonFormat(pattern="yyyy-MM-dd")
    @Excel(name="\u6709\u6548\u671f\u8d77\u59cb\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd")
    private Date validityStartTime;
    @JsonFormat(pattern="yyyy-MM-dd")
    @Excel(name="\u6709\u6548\u671f\u7ed3\u675f\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd")
    private Date validityEndTime;
    private SysUserLevel sysUserLevel;
    private String mobile;

    public String getMobile() {
        return this.mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public SysUserLevel getSysUserLevel() {
        return this.sysUserLevel;
    }

    public void setSysUserLevel(SysUserLevel sysUserLevel) {
        this.sysUserLevel = sysUserLevel;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setLevelId(Long levelId) {
        this.levelId = levelId;
    }

    public Long getLevelId() {
        return this.levelId;
    }

    public void setValidityType(Long validityType) {
        this.validityType = validityType;
    }

    public Long getValidityType() {
        return this.validityType;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public Long getStatus() {
        return this.status;
    }

    public void setValidityStartTime(Date validityStartTime) {
        this.validityStartTime = validityStartTime;
    }

    public Date getValidityStartTime() {
        return this.validityStartTime;
    }

    public void setValidityEndTime(Date validityEndTime) {
        this.validityEndTime = validityEndTime;
    }

    public Date getValidityEndTime() {
        return this.validityEndTime;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("userId", (Object)this.getUserId()).append("levelId", (Object)this.getLevelId()).append("validityType", (Object)this.getValidityType()).append("status", (Object)this.getStatus()).append("validityStartTime", (Object)this.getValidityStartTime()).append("validityEndTime", (Object)this.getValidityEndTime()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

