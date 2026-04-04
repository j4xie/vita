/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonFormat
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  com.ruoyi.common.utils.CommonUtils
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.common.utils.CommonUtils;
import java.math.BigDecimal;
import java.util.Date;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysUserExCoupon
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u5238\u8868id")
    private Long couponId;
    @Excel(name="\u7528\u6237user_id")
    private Long userId;
    @Excel(name="\u5238\u540d\u79f0")
    private String couponName;
    @Excel(name="\u5238\u7c7b\u578b", readConverterExp="1=-\u4ee3\u91d1\u5238")
    private Long couponType;
    private String couponTypeName;
    @Excel(name="\u5238\u91d1\u989d")
    private BigDecimal couponPrice;
    @Excel(name="\u5238\u7801")
    private String couponNo;
    @Excel(name="\u4f7f\u7528\u95e8\u69db", readConverterExp="0=-\u65e0\u95e8\u69db")
    private BigDecimal couponLimit;
    @Excel(name="\u4f18\u60e0\u5238\u4f7f\u7528\u89c4\u5219")
    private String couponRules;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u6709\u6548\u671f\u5f00\u59cb\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date validFrom;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u6709\u6548\u671f\u7ed3\u675f\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date validEnd;
    private Date currentTime;
    @Excel(name="\u6570\u91cf\uff0c\u7528\u6237\u7684\u6570\u91cf\u90fd\u662f1")
    private Long quantity;
    @Excel(name="\u72b6\u6001", readConverterExp="-=1-\u5f85\u5ba1\u6838,1=-\u5ba1\u6838\u901a\u8fc7,2=-\u5ba1\u6838\u62d2\u7edd,3=-\u5df2\u8fc7\u671f")
    private Long status;
    private String statusName;
    @Excel(name="\u6765\u6e90", readConverterExp="1=-\u5546\u5bb6,2=-\u5e73\u53f0")
    private Long sourceFrom;
    private String sourceFromName;
    private Long purpose;
    private String purposeMerchantUserId;
    private String purposeMerchantName;
    @Excel(name="\u521b\u5efa\u4ebauser_id")
    private Long createByUserId;
    @Excel(name="\u521b\u5efa\u4eba", readConverterExp="\u5546=\u5bb6-\u5546\u5bb6\u540d\u79f0,\u5e73=\u53f0-legal_name")
    private String createByName;
    private String phonenumber;
    private String legalName;

    public Date getCurrentTime() {
        return this.currentTime;
    }

    public void setCurrentTime(Date currentTime) {
        this.currentTime = currentTime;
    }

    public String getSourceFromName() {
        return this.sourceFromName;
    }

    public void setSourceFromName(String sourceFromName) {
        this.sourceFromName = sourceFromName;
    }

    public String getStatusName() {
        return this.statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }

    public String getCouponTypeName() {
        return this.couponTypeName;
    }

    public void setCouponTypeName(String couponTypeName) {
        this.couponTypeName = couponTypeName;
    }

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getPhonenumber() {
        return this.phonenumber;
    }

    public void setPhonenumber(String phonenumber) {
        this.phonenumber = phonenumber;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setCouponId(Long couponId) {
        this.couponId = couponId;
    }

    public Long getCouponId() {
        return this.couponId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setCouponName(String couponName) {
        this.couponName = couponName;
    }

    public String getCouponName() {
        return this.couponName;
    }

    public void setCouponType(Long couponType) {
        this.couponType = couponType;
        this.setCouponTypeName(CommonUtils.getCouponTypeName((Long)couponType));
    }

    public Long getCouponType() {
        return this.couponType;
    }

    public void setCouponPrice(BigDecimal couponPrice) {
        this.couponPrice = couponPrice;
    }

    public BigDecimal getCouponPrice() {
        return this.couponPrice;
    }

    public void setCouponNo(String couponNo) {
        this.couponNo = couponNo;
    }

    public String getCouponNo() {
        return this.couponNo;
    }

    public void setCouponLimit(BigDecimal couponLimit) {
        this.couponLimit = couponLimit;
    }

    public BigDecimal getCouponLimit() {
        return this.couponLimit;
    }

    public void setCouponRules(String couponRules) {
        this.couponRules = couponRules;
    }

    public String getCouponRules() {
        return this.couponRules;
    }

    public void setValidFrom(Date validFrom) {
        this.validFrom = validFrom;
    }

    public Date getValidFrom() {
        return this.validFrom;
    }

    public void setValidEnd(Date validEnd) {
        this.validEnd = validEnd;
    }

    public Date getValidEnd() {
        return this.validEnd;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public Long getQuantity() {
        return this.quantity;
    }

    public void setStatus(Long status) {
        this.status = status;
        this.setStatusName(CommonUtils.getUserCouponStatusName((Long)status));
    }

    public Long getStatus() {
        return this.status;
    }

    public void setSourceFrom(Long sourceFrom) {
        this.sourceFrom = sourceFrom;
        if (1L == sourceFrom) {
            this.setSourceFromName("\u5546\u5bb6\u5238");
        } else if (2L == sourceFrom) {
            this.setSourceFromName("\u5e73\u53f0\u5238");
        }
    }

    public Long getSourceFrom() {
        return this.sourceFrom;
    }

    public void setCreateByUserId(Long createByUserId) {
        this.createByUserId = createByUserId;
    }

    public Long getCreateByUserId() {
        return this.createByUserId;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public String getCreateByName() {
        return this.createByName;
    }

    public Long getPurpose() {
        return this.purpose;
    }

    public void setPurpose(Long purpose) {
        this.purpose = purpose;
    }

    public String getPurposeMerchantUserId() {
        return this.purposeMerchantUserId;
    }

    public void setPurposeMerchantUserId(String purposeMerchantUserId) {
        this.purposeMerchantUserId = purposeMerchantUserId;
    }

    public String getPurposeMerchantName() {
        return this.purposeMerchantName;
    }

    public void setPurposeMerchantName(String purposeMerchantName) {
        this.purposeMerchantName = purposeMerchantName;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("couponId", (Object)this.getCouponId()).append("userId", (Object)this.getUserId()).append("couponName", (Object)this.getCouponName()).append("couponType", (Object)this.getCouponType()).append("couponPrice", (Object)this.getCouponPrice()).append("couponNo", (Object)this.getCouponNo()).append("couponLimit", (Object)this.getCouponLimit()).append("couponRules", (Object)this.getCouponRules()).append("validFrom", (Object)this.getValidFrom()).append("validEnd", (Object)this.getValidEnd()).append("quantity", (Object)this.getQuantity()).append("status", (Object)this.getStatus()).append("sourceFrom", (Object)this.getSourceFrom()).append("createByUserId", (Object)this.getCreateByUserId()).append("createByName", (Object)this.getCreateByName()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

