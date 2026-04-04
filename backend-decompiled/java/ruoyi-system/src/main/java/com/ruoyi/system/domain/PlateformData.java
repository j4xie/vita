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

public class PlateformData
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u5185\u5bb9key")
    private String dataKey;
    @Excel(name="data\u503c")
    private String dataValue;
    @Excel(name="data\u63cf\u8ff0")
    private String dataDesc;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setDataKey(String dataKey) {
        this.dataKey = dataKey;
    }

    public String getDataKey() {
        return this.dataKey;
    }

    public void setDataValue(String dataValue) {
        this.dataValue = dataValue;
    }

    public String getDataValue() {
        return this.dataValue;
    }

    public void setDataDesc(String dataDesc) {
        this.dataDesc = dataDesc;
    }

    public String getDataDesc() {
        return this.dataDesc;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("dataKey", (Object)this.getDataKey()).append("dataValue", (Object)this.getDataValue()).append("dataDesc", (Object)this.getDataDesc()).append("createTime", (Object)this.getCreateTime()).append("updateTime", (Object)this.getUpdateTime()).toString();
    }
}

