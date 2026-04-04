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
import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class UserExtendsData
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u7528\u6237user_id")
    private Long userId;
    @Excel(name="\u7528\u6237\u79ef\u5206")
    private BigDecimal userPoint;
    private Long validityType;
    private Long status;
    private BigDecimal pointRate;

    public BigDecimal getPointRate() {
        return this.pointRate;
    }

    public void setPointRate(BigDecimal pointRate) {
        this.pointRate = pointRate;
    }

    public Long getValidityType() {
        return this.validityType;
    }

    public void setValidityType(Long validityType) {
        this.validityType = validityType;
    }

    public Long getStatus() {
        return this.status;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserPoint(BigDecimal userPoint) {
        this.userPoint = userPoint;
    }

    public BigDecimal getUserPoint() {
        return this.userPoint;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("userId", (Object)this.getUserId()).append("userPoint", (Object)this.getUserPoint()).toString();
    }
}

