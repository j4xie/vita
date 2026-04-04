/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class UserExtendsDataLog
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u7528\u6237id")
    private Long userId;
    @Excel(name="\u53d8\u66f4\u5185\u5bb9")
    private String exPoint;
    @Excel(name="1-\u79ef\u5206")
    private Long exType;
    private String exRemark;

    public String getExRemark() {
        return this.exRemark;
    }

    public void setExRemark(String exRemark) {
        this.exRemark = exRemark;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setExPoint(String exPoint) {
        this.exPoint = exPoint;
    }

    public String getExPoint() {
        return this.exPoint;
    }

    public void setExType(Long exType) {
        this.exType = exType;
    }

    public Long getExType() {
        return this.exType;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("userId", (Object)this.getUserId()).append("exPoint", (Object)this.getExPoint()).append("exType", (Object)this.getExType()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

