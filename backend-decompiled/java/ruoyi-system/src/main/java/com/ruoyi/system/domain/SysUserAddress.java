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

public class SysUserAddress
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u6536\u4ef6\u4eba\u59d3\u540d")
    private String name;
    @Excel(name="\u56fd\u5bb6\u4ee3\u7801")
    private String intAreaCode;
    @Excel(name="\u6536\u4ef6\u4eba\u53f7\u7801")
    private String mobile;
    @Excel(name="\u5730\u5740")
    private String address;
    @Excel(name="\u8be6\u7ec6\u5730\u5740")
    private String detailAddr;
    @Excel(name="\u7ecf\u5ea6")
    private String longitude;
    @Excel(name="\u7eac\u5ea6")
    private String latitude;
    @Excel(name="\u662f\u5426\u9ed8\u8ba4\u5730\u5740", readConverterExp="-=1-\u5426,1=-\u662f")
    private Long isDefault;
    @Excel(name="\u521b\u5efa\u7528\u6237\u7684user_id")
    private Long createById;
    @Excel(name="\u521b\u5efa\u7528\u6237\u7684\u6cd5\u5b9a\u59d3\u540d")
    private String createByName;

    public Long getCreateById() {
        return this.createById;
    }

    public void setCreateById(Long createById) {
        this.createById = createById;
    }

    public String getCreateByName() {
        return this.createByName;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

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

    public void setIntAreaCode(String intAreaCode) {
        this.intAreaCode = intAreaCode;
    }

    public String getIntAreaCode() {
        return this.intAreaCode;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getMobile() {
        return this.mobile;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAddress() {
        return this.address;
    }

    public void setDetailAddr(String detailAddr) {
        this.detailAddr = detailAddr;
    }

    public String getDetailAddr() {
        return this.detailAddr;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getLongitude() {
        return this.longitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public String getLatitude() {
        return this.latitude;
    }

    public void setIsDefault(Long isDefault) {
        this.isDefault = isDefault;
    }

    public Long getIsDefault() {
        return this.isDefault;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("name", (Object)this.getName()).append("intAreaCode", (Object)this.getIntAreaCode()).append("mobile", (Object)this.getMobile()).append("address", (Object)this.getAddress()).append("detailAddr", (Object)this.getDetailAddr()).append("longitude", (Object)this.getLongitude()).append("latitude", (Object)this.getLatitude()).append("isDefault", (Object)this.getIsDefault()).append("createTime", (Object)this.getCreateTime()).append("updateTime", (Object)this.getUpdateTime()).toString();
    }
}

