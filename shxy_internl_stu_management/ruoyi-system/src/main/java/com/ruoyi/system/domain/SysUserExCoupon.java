package com.ruoyi.system.domain;

import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.utils.CommonUtils;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 用户关联优惠券对象 sys_user_ex_coupon
 * 
 * @author ruoyi
 * @date 2025-09-25
 */
public class SysUserExCoupon extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 券表id */
    @Excel(name = "券表id")
    private Long couponId;

    /** 用户user_id */
    @Excel(name = "用户user_id")
    private Long userId;

    /** 券名称 */
    @Excel(name = "券名称")
    private String couponName;

    /** 券类型（1-代金券） */
    @Excel(name = "券类型", readConverterExp = "1=-代金券")
    private Long couponType;

    private String couponTypeName;

    /** 券金额 */
    @Excel(name = "券金额")
    private BigDecimal couponPrice;

    /** 券码 */
    @Excel(name = "券码")
    private String couponNo;

    /** 使用门槛（0-无门槛） */
    @Excel(name = "使用门槛", readConverterExp = "0=-无门槛")
    private BigDecimal couponLimit;

    /** 优惠券使用规则 */
    @Excel(name = "优惠券使用规则")
    private String couponRules;

    /** 有效期开始时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "有效期开始时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date validFrom;

    /** 有效期结束时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "有效期结束时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date validEnd;

    /** 当前时间 */
    private Date currentTime;

    /** 数量，用户的数量都是1 */
    @Excel(name = "数量，用户的数量都是1")
    private Long quantity;

    /** 状态（-1-待审核    1-审核通过     2-审核拒绝    3-已过期） */
    @Excel(name = "状态", readConverterExp = "-=1-待审核,1=-审核通过,2=-审核拒绝,3=-已过期")
    private Long status;

    private String statusName;

    /** 来源（1-商家    2-平台） */
    @Excel(name = "来源", readConverterExp = "1=-商家,2=-平台")
    private Long sourceFrom;

    private String sourceFromName;

    /**
     * 适用范围（1-全部门店     2-指定门店）
     */
    private Long purpose;

    /**
     * 可用门店的user_id
     */
    private String purposeMerchantUserId;

    private String purposeMerchantName;

    /** 创建人user_id */
    @Excel(name = "创建人user_id")
    private Long createByUserId;

    /** 创建人（商家-商家名称       平台-legal_name） */
    @Excel(name = "创建人", readConverterExp = "商=家-商家名称,平=台-legal_name")
    private String createByName;

    private String phonenumber;

    /**
     * 券拥有人法定姓名
     */
    private String legalName;

    public Date getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(Date currentTime) {
        this.currentTime = currentTime;
    }

    public String getSourceFromName() {
        return sourceFromName;
    }

    public void setSourceFromName(String sourceFromName) {
        this.sourceFromName = sourceFromName;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }

    public String getCouponTypeName() {
        return couponTypeName;
    }

    public void setCouponTypeName(String couponTypeName) {
        this.couponTypeName = couponTypeName;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getPhonenumber() {
        return phonenumber;
    }

    public void setPhonenumber(String phonenumber) {
        this.phonenumber = phonenumber;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setCouponId(Long couponId) 
    {
        this.couponId = couponId;
    }

    public Long getCouponId() 
    {
        return couponId;
    }

    public void setUserId(Long userId) 
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setCouponName(String couponName) 
    {
        this.couponName = couponName;
    }

    public String getCouponName() 
    {
        return couponName;
    }

    public void setCouponType(Long couponType) 
    {
        this.couponType = couponType;
        setCouponTypeName(CommonUtils.getCouponTypeName(couponType));
    }

    public Long getCouponType() 
    {
        return couponType;
    }

    public void setCouponPrice(BigDecimal couponPrice) 
    {
        this.couponPrice = couponPrice;
    }

    public BigDecimal getCouponPrice() 
    {
        return couponPrice;
    }

    public void setCouponNo(String couponNo) 
    {
        this.couponNo = couponNo;
    }

    public String getCouponNo() 
    {
        return couponNo;
    }

    public void setCouponLimit(BigDecimal couponLimit) 
    {
        this.couponLimit = couponLimit;
    }

    public BigDecimal getCouponLimit() 
    {
        return couponLimit;
    }

    public void setCouponRules(String couponRules) 
    {
        this.couponRules = couponRules;
    }

    public String getCouponRules() 
    {
        return couponRules;
    }

    public void setValidFrom(Date validFrom) 
    {
        this.validFrom = validFrom;
    }

    public Date getValidFrom() 
    {
        return validFrom;
    }

    public void setValidEnd(Date validEnd) 
    {
        this.validEnd = validEnd;
    }

    public Date getValidEnd() 
    {
        return validEnd;
    }

    public void setQuantity(Long quantity) 
    {
        this.quantity = quantity;
    }

    public Long getQuantity() 
    {
        return quantity;
    }

    public void setStatus(Long status) 
    {
        this.status = status;
        setStatusName(CommonUtils.getUserCouponStatusName(status));
    }

    public Long getStatus() 
    {
        return status;
    }

    public void setSourceFrom(Long sourceFrom) 
    {
        this.sourceFrom = sourceFrom;
        if(1 == sourceFrom){
            setSourceFromName("商家券");
        }else if(2 == sourceFrom){
            setSourceFromName("平台券");
        }
    }

    public Long getSourceFrom() 
    {
        return sourceFrom;
    }

    public void setCreateByUserId(Long createByUserId) 
    {
        this.createByUserId = createByUserId;
    }

    public Long getCreateByUserId() 
    {
        return createByUserId;
    }

    public void setCreateByName(String createByName) 
    {
        this.createByName = createByName;
    }

    public String getCreateByName() 
    {
        return createByName;
    }

    public Long getPurpose() {
        return purpose;
    }

    public void setPurpose(Long purpose) {
        this.purpose = purpose;
    }

    public String getPurposeMerchantUserId() {
        return purposeMerchantUserId;
    }

    public void setPurposeMerchantUserId(String purposeMerchantUserId) {
        this.purposeMerchantUserId = purposeMerchantUserId;
    }

    public String getPurposeMerchantName() {
        return purposeMerchantName;
    }

    public void setPurposeMerchantName(String purposeMerchantName) {
        this.purposeMerchantName = purposeMerchantName;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("couponId", getCouponId())
            .append("userId", getUserId())
            .append("couponName", getCouponName())
            .append("couponType", getCouponType())
            .append("couponPrice", getCouponPrice())
            .append("couponNo", getCouponNo())
            .append("couponLimit", getCouponLimit())
            .append("couponRules", getCouponRules())
            .append("validFrom", getValidFrom())
            .append("validEnd", getValidEnd())
            .append("quantity", getQuantity())
            .append("status", getStatus())
            .append("sourceFrom", getSourceFrom())
            .append("createByUserId", getCreateByUserId())
            .append("createByName", getCreateByName())
            .append("createTime", getCreateTime())
            .toString();
    }
}
