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

public class ActivityType
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u7c7b\u578b\u540d\u79f0")
    private String name;
    @Excel(name="\u6807\u8bc6")
    private String tag;
    @Excel(name="\u663e\u793a\u987a\u5e8f")
    private Long orderNum;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return this.name;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getTag() {
        return this.tag;
    }

    public void setOrderNum(Long orderNum) {
        this.orderNum = orderNum;
    }

    public Long getOrderNum() {
        return this.orderNum;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("name", (Object)this.getName()).append("tag", (Object)this.getTag()).append("orderNum", (Object)this.getOrderNum()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

