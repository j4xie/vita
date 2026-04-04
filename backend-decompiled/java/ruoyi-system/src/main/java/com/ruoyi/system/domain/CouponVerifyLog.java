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

public class CouponVerifyLog
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u7528\u6237\u5238id")
    private Long userCouponId;
    private String couponName;
    private String couponNo;
    private Long userId;
    private String legalName;
    private Long verifyById;
    private String verifyMerchantName;

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getCouponName() {
        return this.couponName;
    }

    public void setCouponName(String couponName) {
        this.couponName = couponName;
    }

    public String getCouponNo() {
        return this.couponNo;
    }

    public void setCouponNo(String couponNo) {
        this.couponNo = couponNo;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getVerifyById() {
        return this.verifyById;
    }

    public void setVerifyById(Long verifyById) {
        this.verifyById = verifyById;
    }

    public String getVerifyMerchantName() {
        return this.verifyMerchantName;
    }

    public void setVerifyMerchantName(String verifyMerchantName) {
        this.verifyMerchantName = verifyMerchantName;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setUserCouponId(Long userCouponId) {
        this.userCouponId = userCouponId;
    }

    public Long getUserCouponId() {
        return this.userCouponId;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("userCouponId", (Object)this.getUserCouponId()).append("remark", (Object)this.getRemark()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

