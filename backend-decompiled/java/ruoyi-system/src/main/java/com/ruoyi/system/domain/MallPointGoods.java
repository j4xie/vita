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

public class MallPointGoods
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u5546\u54c1\u540d\u79f0")
    private String goodName;
    @Excel(name="\u5546\u54c1\u5c55\u793a\u56fe")
    private String goodIcon;
    @Excel(name="\u5546\u54c1\u5206\u7c7bid")
    private Long classifyId;
    private String classifyName;
    @Excel(name="\u5546\u54c1\u7b80\u4ecb")
    private String goodDesc;
    @Excel(name="\u5546\u54c1\u4ef7\u683c")
    private Long price;
    @Excel(name="\u5e93\u5b58\u6570\u91cf")
    private Long quantity;
    @Excel(name="\u6570\u91cf\u5355\u4f4d")
    private String unit;
    @Excel(name="\u5546\u54c1\u8be6\u60c5")
    private String goodDetail;
    private Long createUserId;

    public Long getQuantity() {
        return this.quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return this.unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getClassifyName() {
        return this.classifyName;
    }

    public void setClassifyName(String classifyName) {
        this.classifyName = classifyName;
    }

    public Long getCreateUserId() {
        return this.createUserId;
    }

    public void setCreateUserId(Long createUserId) {
        this.createUserId = createUserId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setGoodName(String goodName) {
        this.goodName = goodName;
    }

    public String getGoodName() {
        return this.goodName;
    }

    public void setGoodIcon(String goodIcon) {
        this.goodIcon = goodIcon;
    }

    public String getGoodIcon() {
        return this.goodIcon;
    }

    public void setGoodDesc(String goodDesc) {
        this.goodDesc = goodDesc;
    }

    public String getGoodDesc() {
        return this.goodDesc;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public Long getPrice() {
        return this.price;
    }

    public void setGoodDetail(String goodDetail) {
        this.goodDetail = goodDetail;
    }

    public String getGoodDetail() {
        return this.goodDetail;
    }

    public Long getClassifyId() {
        return this.classifyId;
    }

    public void setClassifyId(Long classifyId) {
        this.classifyId = classifyId;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("goodName", (Object)this.getGoodName()).append("goodIcon", (Object)this.getGoodIcon()).append("classifyId", (Object)this.getClassifyId()).append("goodDesc", (Object)this.getGoodDesc()).append("price", (Object)this.getPrice()).append("quantity", (Object)this.getQuantity()).append("unit", (Object)this.getUnit()).append("goodDetail", (Object)this.getGoodDetail()).append("createTime", (Object)this.getCreateTime()).append("createBy", (Object)this.getCreateBy()).append("createUserId", (Object)this.getCreateUserId()).append("updateTime", (Object)this.getUpdateTime()).append("updateBy", (Object)this.getUpdateBy()).toString();
    }
}

