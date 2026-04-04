/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.Pattern
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysDictType
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u5b57\u5178\u4e3b\u952e", cellType=Excel.ColumnType.NUMERIC)
    private Long dictId;
    @Excel(name="\u5b57\u5178\u540d\u79f0")
    private String dictName;
    @Excel(name="\u5b57\u5178\u7c7b\u578b")
    private String dictType;
    @Excel(name="\u72b6\u6001", readConverterExp="0=\u6b63\u5e38,1=\u505c\u7528")
    private String status;

    public Long getDictId() {
        return this.dictId;
    }

    public void setDictId(Long dictId) {
        this.dictId = dictId;
    }

    @NotBlank(message="\u5b57\u5178\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u5b57\u5178\u7c7b\u578b\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u5b57\u5178\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u5b57\u5178\u7c7b\u578b\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getDictName() {
        return this.dictName;
    }

    public void setDictName(String dictName) {
        this.dictName = dictName;
    }

    @NotBlank(message="\u5b57\u5178\u7c7b\u578b\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u5b57\u5178\u7c7b\u578b\u7c7b\u578b\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    @Pattern(regexp="^[a-z][a-z0-9_]*$", message="\u5b57\u5178\u7c7b\u578b\u5fc5\u987b\u4ee5\u5b57\u6bcd\u5f00\u5934\uff0c\u4e14\u53ea\u80fd\u4e3a\uff08\u5c0f\u5199\u5b57\u6bcd\uff0c\u6570\u5b57\uff0c\u4e0b\u6ed1\u7ebf\uff09")
    public @NotBlank(message="\u5b57\u5178\u7c7b\u578b\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u5b57\u5178\u7c7b\u578b\u7c7b\u578b\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") @Pattern(regexp="^[a-z][a-z0-9_]*$", message="\u5b57\u5178\u7c7b\u578b\u5fc5\u987b\u4ee5\u5b57\u6bcd\u5f00\u5934\uff0c\u4e14\u53ea\u80fd\u4e3a\uff08\u5c0f\u5199\u5b57\u6bcd\uff0c\u6570\u5b57\uff0c\u4e0b\u6ed1\u7ebf\uff09") String getDictType() {
        return this.dictType;
    }

    public void setDictType(String dictType) {
        this.dictType = dictType;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("dictId", (Object)this.getDictId()).append("dictName", (Object)this.getDictName()).append("dictType", (Object)this.getDictType()).append("status", (Object)this.getStatus()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).toString();
    }
}

