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
 * 优惠券对象 sys_coupon
 * 
 * @author ruoyi
 * @date 2025-09-17
 */
public class SysCoupon extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 券名称 */
    @Excel(name = "券名称")
    private String couponName;

    /** 券类型（1-代金券） */
    @Excel(name = "券类型", readConverterExp = "1=-代金券")
    private Long couponType;

    private String couponTypeName;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private BigDecimal couponPrice;

    /** 券码 */
    @Excel(name = "券码")
    private String couponNo;

    /** 使用门槛（0-无门槛） */
    @Excel(name = "使用门槛", readConverterExp = "0=-无门槛")
    private BigDecimal couponLimit;

    /** 优惠券使用规则 */
    @Excel(name = "使用规则")
    private String couponRules;

    /** 有效期开始时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "有效期开始时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date validFrom;

    /** 有效期结束时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "有效期结束时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date validEnd;

    /** 库存数量 */
    @Excel(name = "库存数量")
    private Long quantity;

    /** 状态（-1-待审核    1-审核通过     2-审核拒绝    3-已过期） */
    @Excel(name = "状态", readConverterExp = "-=1-待审核,1=-审核通过,2=-审核拒绝,3=-已过期")
    private Long status;

    private String statusName;

    /**
     * 备注--拒绝原因
     */
    private String remark;

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

    private Long createByUserId;

    /** 创建人（商家-商家名称       平台-legal_name） */
    @Excel(name = "创建人", readConverterExp = "商=家-商家名称,平=台-legal_name")
    private String createByName;

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

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public Long getCreateByUserId() {
        return createByUserId;
    }

    public void setCreateByUserId(Long createByUserId) {
        this.createByUserId = createByUserId;
    }

    public String getCouponRules() {
        return couponRules;
    }

    public void setCouponRules(String couponRules) {
        this.couponRules = couponRules;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
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

    public void setStatus(Long status) 
    {
        this.status = status;
        CommonUtils.getCouponStatusName(status);
    }

    public Long getStatus() 
    {
        return status;
    }

    public void setSourceFrom(Long sourceFrom) 
    {
        this.sourceFrom = sourceFrom;
        if(null != sourceFrom){
            if(1 == sourceFrom){
                setSourceFromName("商家券");
            }else if(2 == sourceFrom){
                setSourceFromName("平台券");
            }
        }
    }

    public Long getSourceFrom() 
    {
        return sourceFrom;
    }

    public void setCreateByName(String createByName) 
    {
        this.createByName = createByName;
    }

    public String getCreateByName() 
    {
        return createByName;
    }

    @Override
    public String getRemark() {
        return remark;
    }

    @Override
    public void setRemark(String remark) {
        this.remark = remark;
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
            .append("couponName", getCouponName())
            .append("couponType", getCouponType())
            .append("couponPrice", getCouponPrice())
            .append("couponNo", getCouponNo())
            .append("couponLimit", getCouponLimit())
            .append("validFrom", getValidFrom())
            .append("validEnd", getValidEnd())
            .append("quantity", getQuantity())
            .append("status", getStatus())
            .append("remark", getRemark())
            .append("sourceFrom", getSourceFrom())
            .append("createTime", getCreateTime())
            .append("createBy", getCreateBy())
            .append("createByName", getCreateByName())
            .toString();
    }
}
