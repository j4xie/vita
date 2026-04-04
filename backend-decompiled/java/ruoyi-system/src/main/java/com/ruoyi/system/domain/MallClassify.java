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

public class MallClassify
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u5206\u7c7b\u540d\u79f0")
    private String catName;
    @Excel(name="\u5206\u7c7b\u56fe\u6807")
    private String catImg;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setCatName(String catName) {
        this.catName = catName;
    }

    public String getCatName() {
        return this.catName;
    }

    public void setCatImg(String catImg) {
        this.catImg = catImg;
    }

    public String getCatImg() {
        return this.catImg;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("catName", (Object)this.getCatName()).append("catImg", (Object)this.getCatImg()).append("createTime", (Object)this.getCreateTime()).append("createBy", (Object)this.getCreateBy()).append("updateTime", (Object)this.getUpdateTime()).append("updateBy", (Object)this.getUpdateBy()).toString();
    }
}

