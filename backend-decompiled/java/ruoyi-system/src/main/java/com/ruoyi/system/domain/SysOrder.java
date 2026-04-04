/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonFormat
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import java.math.BigDecimal;
import java.util.Date;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysOrder
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String title;
    @Excel(name="\u79ef\u5206\u5546\u54c1\u8868\u7684id")
    private Long goodsId;
    private Long activityId;
    @Excel(name="\u6536\u8d27\u5730\u5740\u7684id")
    private Long addrId;
    @Excel(name="\u8ba2\u5355\u7f16\u53f7")
    private String orderNo;
    @Excel(name="\u8ba2\u5355\u72b6\u6001", readConverterExp="1=-\u5f85\u652f\u4ed8,2=-\u5df2\u5b8c\u6210,3=-\u5df2\u53d6\u6d88,4=-\u5df2\u9000\u6b3e,5=-\u5f85\u53d1\u8d27,6=-\u5f85\u6536\u8d27")
    private Long orderStatus;
    private String orderStatusText;
    @Excel(name="\u8ba2\u5355\u7c7b\u578b", readConverterExp="1=-\u79ef\u5206\u5546\u57ce\u6d88\u8d39,2=-\u6d3b\u52a8\u652f\u4ed8,3=-\u4f1a\u5458\u7b49\u7ea7\u652f\u4ed8")
    private Long orderType;
    private String orderTypeText;
    @Excel(name="\u6d88\u8d39\u65b9\u5f0f", readConverterExp="1=-\u91d1\u989d,2=-\u79ef\u5206")
    private Long payMode;
    private String payModeText;
    @Excel(name="\u8ba2\u5355\u63cf\u8ff0")
    private String orderDesc;
    @Excel(name="\u8ba2\u5355\u91d1\u989d")
    private BigDecimal price;
    private Integer num;
    private String receivingName;
    private String receivingMobile;
    private String receivingAddress;
    private String intAreaCode;
    private String longitude;
    private String latitude;
    private String trackingNumber;
    private String logisticsCompany;
    private String remark;
    private String cancelReason;
    private Long payChannel;
    private String orderStr;
    @Excel(name="\u8ba2\u5355\u521b\u5efa\u8005\u7684user_id")
    private Long createById;
    @Excel(name="\u8ba2\u5355\u521b\u5efa\u8005\u7684legal_name")
    private String createByName;
    @JsonFormat(pattern="yyyy-MM-dd")
    @Excel(name="\u652f\u4ed8\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd")
    private Date payTime;
    @JsonFormat(pattern="yyyy-MM-dd")
    @Excel(name="\u9000\u6b3e\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd")
    private Date refundTime;
    @JsonFormat(pattern="yyyy-MM-dd")
    @Excel(name="\u5173\u95ed/\u53d6\u6d88\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd")
    private Date cancelTime;
    private Date currentTime;
    private String clientSecret;
    private String paymentIntentId;

    public String getClientSecret() {
        return this.clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getPaymentIntentId() {
        return this.paymentIntentId;
    }

    public void setPaymentIntentId(String paymentIntentId) {
        this.paymentIntentId = paymentIntentId;
    }

    public Date getCurrentTime() {
        return this.currentTime;
    }

    public void setCurrentTime(Date currentTime) {
        this.currentTime = currentTime;
    }

    public Long getPayChannel() {
        return this.payChannel;
    }

    public void setPayChannel(Long payChannel) {
        this.payChannel = payChannel;
    }

    public String getOrderStr() {
        return this.orderStr;
    }

    public void setOrderStr(String orderStr) {
        this.orderStr = orderStr;
    }

    public String getRemark() {
        return this.remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getCancelReason() {
        return this.cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public String getTrackingNumber() {
        return this.trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getLogisticsCompany() {
        return this.logisticsCompany;
    }

    public void setLogisticsCompany(String logisticsCompany) {
        this.logisticsCompany = logisticsCompany;
    }

    public String getOrderStatusText() {
        return this.orderStatusText;
    }

    public void setOrderStatusText(String orderStatusText) {
        this.orderStatusText = orderStatusText;
    }

    public String getOrderTypeText() {
        return this.orderTypeText;
    }

    public void setOrderTypeText(String orderTypeText) {
        this.orderTypeText = orderTypeText;
    }

    public String getPayModeText() {
        return this.payModeText;
    }

    public void setPayModeText(String payModeText) {
        this.payModeText = payModeText;
    }

    public Long getActivityId() {
        return this.activityId;
    }

    public void setActivityId(Long activityId) {
        this.activityId = activityId;
    }

    public Integer getNum() {
        return this.num;
    }

    public void setNum(Integer num) {
        this.num = num;
    }

    public String getTitle() {
        return this.title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getReceivingAddress() {
        return this.receivingAddress;
    }

    public void setReceivingAddress(String receivingAddress) {
        this.receivingAddress = receivingAddress;
    }

    public String getReceivingName() {
        return this.receivingName;
    }

    public void setReceivingName(String receivingName) {
        this.receivingName = receivingName;
    }

    public String getReceivingMobile() {
        return this.receivingMobile;
    }

    public void setReceivingMobile(String receivingMobile) {
        this.receivingMobile = receivingMobile;
    }

    public String getIntAreaCode() {
        return this.intAreaCode;
    }

    public void setIntAreaCode(String intAreaCode) {
        this.intAreaCode = intAreaCode;
    }

    public String getLongitude() {
        return this.longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getLatitude() {
        return this.latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setGoodsId(Long goodsId) {
        this.goodsId = goodsId;
    }

    public Long getGoodsId() {
        return this.goodsId;
    }

    public void setAddrId(Long addrId) {
        this.addrId = addrId;
    }

    public Long getAddrId() {
        return this.addrId;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getOrderNo() {
        return this.orderNo;
    }

    public void setOrderStatus(Long orderStatus) {
        this.orderStatus = orderStatus;
    }

    public Long getOrderStatus() {
        return this.orderStatus;
    }

    public void setOrderType(Long orderType) {
        this.orderType = orderType;
    }

    public Long getOrderType() {
        return this.orderType;
    }

    public void setPayMode(Long payMode) {
        this.payMode = payMode;
    }

    public Long getPayMode() {
        return this.payMode;
    }

    public void setOrderDesc(String orderDesc) {
        this.orderDesc = orderDesc;
    }

    public String getOrderDesc() {
        return this.orderDesc;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getPrice() {
        return this.price;
    }

    public void setCreateById(Long createById) {
        this.createById = createById;
    }

    public Long getCreateById() {
        return this.createById;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public String getCreateByName() {
        return this.createByName;
    }

    public void setPayTime(Date payTime) {
        this.payTime = payTime;
    }

    public Date getPayTime() {
        return this.payTime;
    }

    public void setRefundTime(Date refundTime) {
        this.refundTime = refundTime;
    }

    public Date getRefundTime() {
        return this.refundTime;
    }

    public void setCancelTime(Date cancelTime) {
        this.cancelTime = cancelTime;
    }

    public Date getCancelTime() {
        return this.cancelTime;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("goodsId", (Object)this.getGoodsId()).append("addrId", (Object)this.getAddrId()).append("orderNo", (Object)this.getOrderNo()).append("orderStatus", (Object)this.getOrderStatus()).append("orderType", (Object)this.getOrderType()).append("payMode", (Object)this.getPayMode()).append("orderDesc", (Object)this.getOrderDesc()).append("price", (Object)this.getPrice()).append("createById", (Object)this.getCreateById()).append("createByName", (Object)this.getCreateByName()).append("createTime", (Object)this.getCreateTime()).append("payTime", (Object)this.getPayTime()).append("refundTime", (Object)this.getRefundTime()).append("cancelTime", (Object)this.getCancelTime()).toString();
    }
}

