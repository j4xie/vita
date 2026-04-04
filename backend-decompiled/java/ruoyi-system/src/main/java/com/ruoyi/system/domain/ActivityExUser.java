/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class ActivityExUser
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u6d3b\u52a8id")
    private Long activityId;
    @Excel(name="\u7528\u6237id")
    private Long userId;
    @Excel(name="\u7b7e\u5230\u72b6\u6001", readConverterExp="-=1,\u672a=\u7b7e\u5230,1=,\u5df2=\u7b7e\u5230")
    private Long signStatus;
    private String modelFormInfo;
    private Long status;
    private Long shareUserId;
    private String legalName;
    private String nickName;
    private String phonenumber;

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
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

    public Long getShareUserId() {
        return this.shareUserId;
    }

    public void setShareUserId(Long shareUserId) {
        this.shareUserId = shareUserId;
    }

    public String getModelFormInfo() {
        return this.modelFormInfo;
    }

    public void setModelFormInfo(String modelFormInfo) {
        this.modelFormInfo = modelFormInfo;
    }

    public Long getStatus() {
        return this.status;
    }

    public void setStatus(Long status) {
        this.status = status;
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

