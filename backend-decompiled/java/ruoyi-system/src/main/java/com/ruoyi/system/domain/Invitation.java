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

public class Invitation
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="userId")
    private Long userId;
    @Excel(name="\u9080\u8bf7\u7801")
    private String invCode;

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

    public void setInvCode(String invCode) {
        this.invCode = invCode;
    }

    public String getInvCode() {
        return this.invCode;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("userId", (Object)this.getUserId()).append("invCode", (Object)this.getInvCode()).toString();
    }
}

