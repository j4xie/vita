package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 券核销记录对象 coupon_verify_log
 * 
 * @author ruoyi
 * @date 2025-10-21
 */
public class CouponVerifyLog extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 用户券id */
    @Excel(name = "用户券id")
    private Long userCouponId;

    /** 优惠券名称 */
    private String couponName;

    /** 优惠券券码 */
    private String couponNo;

    /** 券归属用户user_id */
    private Long userId;

    private String legalName;

    /** 核销的商户的user_id */
    private Long verifyById;

    /** 核销的商户名称 */
    private String verifyMerchantName;

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getCouponName() {
        return couponName;
    }

    public void setCouponName(String couponName) {
        this.couponName = couponName;
    }

    public String getCouponNo() {
        return couponNo;
    }

    public void setCouponNo(String couponNo) {
        this.couponNo = couponNo;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getVerifyById() {
        return verifyById;
    }

    public void setVerifyById(Long verifyById) {
        this.verifyById = verifyById;
    }

    public String getVerifyMerchantName() {
        return verifyMerchantName;
    }

    public void setVerifyMerchantName(String verifyMerchantName) {
        this.verifyMerchantName = verifyMerchantName;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setUserCouponId(Long userCouponId) 
    {
        this.userCouponId = userCouponId;
    }

    public Long getUserCouponId() 
    {
        return userCouponId;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("userCouponId", getUserCouponId())
            .append("remark", getRemark())
            .append("createTime", getCreateTime())
            .toString();
    }
}
