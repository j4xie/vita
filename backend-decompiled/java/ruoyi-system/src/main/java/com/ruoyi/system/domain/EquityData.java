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

public class EquityData
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u6743\u76ca\u540d\u79f0")
    private String equName;
    @Excel(name="\u6743\u76ca\u6807\u8bc6")
    private String equTag;
    @Excel(name="\u542f\u7528\u72b6\u6001\uff1a1-\u542f\u7528    -1-\u505c\u7528")
    private Long equStatus;
    @Excel(name="\u6392\u5e8f")
    private Long equSort;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setEquName(String equName) {
        this.equName = equName;
    }

    public String getEquName() {
        return this.equName;
    }

    public void setEquTag(String equTag) {
        this.equTag = equTag;
    }

    public String getEquTag() {
        return this.equTag;
    }

    public void setEquStatus(Long equStatus) {
        this.equStatus = equStatus;
    }

    public Long getEquStatus() {
        return this.equStatus;
    }

    public void setEquSort(Long equSort) {
        this.equSort = equSort;
    }

    public Long getEquSort() {
        return this.equSort;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("equName", (Object)this.getEquName()).append("equTag", (Object)this.getEquTag()).append("equStatus", (Object)this.getEquStatus()).append("equSort", (Object)this.getEquSort()).append("createTime", (Object)this.getCreateTime()).append("updateTime", (Object)this.getUpdateTime()).toString();
    }
}

