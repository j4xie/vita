/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.NotNull
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysPost
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u5c97\u4f4d\u5e8f\u53f7", cellType=Excel.ColumnType.NUMERIC)
    private Long postId;
    @Excel(name="\u5c97\u4f4d\u7f16\u7801")
    private String postCode;
    @Excel(name="\u5c97\u4f4d\u540d\u79f0")
    private String postName;
    @Excel(name="\u5c97\u4f4d\u6392\u5e8f")
    private Integer postSort;
    @Excel(name="\u72b6\u6001", readConverterExp="0=\u6b63\u5e38,1=\u505c\u7528")
    private String status;
    private boolean flag = false;

    public Long getPostId() {
        return this.postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    @NotBlank(message="\u5c97\u4f4d\u7f16\u7801\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=64, message="\u5c97\u4f4d\u7f16\u7801\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc764\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u5c97\u4f4d\u7f16\u7801\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=64, message="\u5c97\u4f4d\u7f16\u7801\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc764\u4e2a\u5b57\u7b26") String getPostCode() {
        return this.postCode;
    }

    public void setPostCode(String postCode) {
        this.postCode = postCode;
    }

    @NotBlank(message="\u5c97\u4f4d\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=50, message="\u5c97\u4f4d\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u5c97\u4f4d\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=50, message="\u5c97\u4f4d\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26") String getPostName() {
        return this.postName;
    }

    public void setPostName(String postName) {
        this.postName = postName;
    }

    @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a")
    public @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a") Integer getPostSort() {
        return this.postSort;
    }

    public void setPostSort(Integer postSort) {
        this.postSort = postSort;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isFlag() {
        return this.flag;
    }

    public void setFlag(boolean flag) {
        this.flag = flag;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("postId", (Object)this.getPostId()).append("postCode", (Object)this.getPostCode()).append("postName", (Object)this.getPostName()).append("postSort", (Object)this.getPostSort()).append("status", (Object)this.getStatus()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).toString();
    }
}

