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

public class UserLevelExEquity
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u4f1a\u5458\u7b49\u7ea7\u5bf9\u5e94\u7684id")
    private Long levelId;
    @Excel(name="\u6743\u76caid")
    private Long equityId;
    @Excel(name="\u6743\u76ca\u540d\u79f0")
    private String equName;
    @Excel(name="\u6743\u76ca\u6807\u8bc6")
    private String equTag;
    @Excel(name="\u6392\u5e8f")
    private Long equSort;

    public String getEquName() {
        return this.equName;
    }

    public void setEquName(String equName) {
        this.equName = equName;
    }

    public String getEquTag() {
        return this.equTag;
    }

    public void setEquTag(String equTag) {
        this.equTag = equTag;
    }

    public Long getEquSort() {
        return this.equSort;
    }

    public void setEquSort(Long equSort) {
        this.equSort = equSort;
    }

    public void setLevelId(Long levelId) {
        this.levelId = levelId;
    }

    public Long getLevelId() {
        return this.levelId;
    }

    public void setEquityId(Long equityId) {
        this.equityId = equityId;
    }

    public Long getEquityId() {
        return this.equityId;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("levelId", (Object)this.getLevelId()).append("equityId", (Object)this.getEquityId()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

