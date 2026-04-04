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
package com.ruoyi.system.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import java.util.Date;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class ActivityExUserVo
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long activityId;
    private Long userId;
    private String modelFormInfo;
    private Long status;
    private String avatar;
    @Excel(name="\u6cd5\u5b9a\u59d3\u540d")
    private String legalName;
    @Excel(name="\u82f1\u6587\u540d")
    private String nickName;
    @Excel(name="\u624b\u673a\u53f7")
    private String phonenumber;
    @Excel(name="\u90ae\u7bb1")
    private String email;
    private String activityName;
    @Excel(name="\u7b7e\u5230\u72b6\u6001", readConverterExp="-1=\u672a\u7b7e\u5230,1=\u5df2\u7b7e\u5230")
    private Long signStatus;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u62a5\u540d\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date createTime;

    public String getAvatar() {
        return this.avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getModelFormInfo() {
        return this.modelFormInfo;
    }

    public void setModelFormInfo(String modelFormInfo) {
        this.modelFormInfo = modelFormInfo;
    }

    public Date getCreateTime() {
        return this.createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public Long getStatus() {
        return this.status;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getActivityName() {
        return this.activityName;
    }

    public void setActivityName(String activityName) {
        this.activityName = activityName;
    }

    public String getNickName() {
        return this.nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public String getPhonenumber() {
        return this.phonenumber;
    }

    public void setPhonenumber(String phonenumber) {
        this.phonenumber = phonenumber;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setActivityId(Long activityId) {
        this.activityId = activityId;
    }

    public Long getActivityId() {
        return this.activityId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setSignStatus(Long signStatus) {
        this.signStatus = signStatus;
    }

    public Long getSignStatus() {
        return this.signStatus;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("activityId", (Object)this.getActivityId()).append("userId", (Object)this.getUserId()).append("signStatus", (Object)this.getSignStatus()).toString();
    }
}

