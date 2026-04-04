/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysDictData
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u5b57\u5178\u7f16\u7801", cellType=Excel.ColumnType.NUMERIC)
    private Long dictCode;
    @Excel(name="\u5b57\u5178\u6392\u5e8f", cellType=Excel.ColumnType.NUMERIC)
    private Long dictSort;
    @Excel(name="\u5b57\u5178\u6807\u7b7e")
    private String dictLabel;
    @Excel(name="\u5b57\u5178\u952e\u503c")
    private String dictValue;
    @Excel(name="\u5b57\u5178\u7c7b\u578b")
    private String dictType;
    private String cssClass;
    private String listClass;
    @Excel(name="\u662f\u5426\u9ed8\u8ba4", readConverterExp="Y=\u662f,N=\u5426")
    private String isDefault;
    @Excel(name="\u72b6\u6001", readConverterExp="0=\u6b63\u5e38,1=\u505c\u7528")
    private String status;

    public Long getDictCode() {
        return this.dictCode;
    }

    public void setDictCode(Long dictCode) {
        this.dictCode = dictCode;
    }

    public Long getDictSort() {
        return this.dictSort;
    }

    public void setDictSort(Long dictSort) {
        this.dictSort = dictSort;
    }

    @NotBlank(message="\u5b57\u5178\u6807\u7b7e\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u5b57\u5178\u6807\u7b7e\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u5b57\u5178\u6807\u7b7e\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u5b57\u5178\u6807\u7b7e\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getDictLabel() {
        return this.dictLabel;
    }

    public void setDictLabel(String dictLabel) {
        this.dictLabel = dictLabel;
    }

    @NotBlank(message="\u5b57\u5178\u952e\u503c\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u5b57\u5178\u952e\u503c\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u5b57\u5178\u952e\u503c\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u5b57\u5178\u952e\u503c\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getDictValue() {
        return this.dictValue;
    }

    public void setDictValue(String dictValue) {
        this.dictValue = dictValue;
    }

    @NotBlank(message="\u5b57\u5178\u7c7b\u578b\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u5b57\u5178\u7c7b\u578b\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u5b57\u5178\u7c7b\u578b\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u5b57\u5178\u7c7b\u578b\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getDictType() {
        return this.dictType;
    }

    public void setDictType(String dictType) {
        this.dictType = dictType;
    }

    @Size(min=0, max=100, message="\u6837\u5f0f\u5c5e\u6027\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=100, message="\u6837\u5f0f\u5c5e\u6027\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getCssClass() {
        return this.cssClass;
    }

    public void setCssClass(String cssClass) {
        this.cssClass = cssClass;
    }

    public String getListClass() {
        return this.listClass;
    }

    public void setListClass(String listClass) {
        this.listClass = listClass;
    }

    public boolean getDefault() {
        return "Y".equals(this.isDefault);
    }

    public String getIsDefault() {
        return this.isDefault;
    }

    public void setIsDefault(String isDefault) {
        this.isDefault = isDefault;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("dictCode", (Object)this.getDictCode()).append("dictSort", (Object)this.getDictSort()).append("dictLabel", (Object)this.getDictLabel()).append("dictValue", (Object)this.getDictValue()).append("dictType", (Object)this.getDictType()).append("cssClass", (Object)this.getCssClass()).append("listClass", (Object)this.getListClass()).append("isDefault", (Object)this.getIsDefault()).append("status", (Object)this.getStatus()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).toString();
    }
}

