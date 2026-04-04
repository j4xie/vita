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

public class VolunteerManHour
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u7528\u6237id")
    private Long userId;
    @Excel(name="\u603b\u5de5\u65f6")
    private Long totalMinutes;
    private String legalName;

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setTotalMinutes(Long totalMinutes) {
        this.totalMinutes = totalMinutes;
    }

    public Long getTotalMinutes() {
        return this.totalMinutes;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("userId", (Object)this.getUserId()).append("totalMinutes", (Object)this.getTotalMinutes()).toString();
    }
}

