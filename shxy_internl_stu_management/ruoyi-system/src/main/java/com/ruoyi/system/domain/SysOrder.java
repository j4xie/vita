package com.ruoyi.system.domain;

import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 订单对象 sys_order
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
public class SysOrder extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 主键 */
    private Long id;

    /** 标题 */
    private String title;

    /** 积分商品表的id */
    @Excel(name = "积分商品表的id")
    private Long goodsId;

    /** 活动表的id */
    private Long activityId;

    /** 收货地址的id */
    @Excel(name = "收货地址的id")
    private Long addrId;

    /** 订单编号 */
    @Excel(name = "订单编号")
    private String orderNo;

    /** 订单状态（1-待支付   2-已完成    3-已取消     4-已退款   5-待发货   6-待收货） */
    @Excel(name = "订单状态", readConverterExp = "1=-待支付,2=-已完成,3=-已取消,4=-已退款,5=-待发货,6=-待收货")
    private Long orderStatus;

    private String orderStatusText;

    /** 订单类型（1-积分商城消费   2-活动支付    3-会员等级支付） */
    @Excel(name = "订单类型", readConverterExp = "1=-积分商城消费,2=-活动支付,3=-会员等级支付")
    private Long orderType;

    private String orderTypeText;

    /** 消费方式（1-金额   2-积分） */
    @Excel(name = "消费方式", readConverterExp = "1=-金额,2=-积分")
    private Long payMode;

    private String payModeText;

    /** 订单描述 */
    @Excel(name = "订单描述")
    private String orderDesc;

    /** 订单金额 */
    @Excel(name = "订单金额")
    private BigDecimal price;

    /** 数量 */
    private Integer num;

    /** 收货人姓名 */
    private String receivingName;

    /** 收件人手机号 */
    private String receivingMobile;

    /** 收货地址 */
    private String receivingAddress;

    /** 国家代码 */
    private String intAreaCode;

    /** 经度 */
    private String longitude;

    /** 纬度 */
    private String latitude;

    /**
     * 物流单号
     */
    private String trackingNumber;

    /**
     * 物流公司
     */
    private String logisticsCompany;

    /** 订单备注 */
    private String remark;

    /** 取消原因 */
    private String cancelReason;

    /**  支付途径  1-支付宝 */
    private Long payChannel;

    /**  订单签名字符串，支付宝返回 */
    private String orderStr;

    /** 订单创建者的user_id */
    @Excel(name = "订单创建者的user_id")
    private Long createById;

    /** 订单创建者的legal_name */
    @Excel(name = "订单创建者的legal_name")
    private String createByName;

    /** 支付时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "支付时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date payTime;

    /** 退款时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "退款时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date refundTime;

    /** 关闭/取消时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "关闭/取消时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date cancelTime;

    /** 当前时间 */
    private Date currentTime;

    public Date getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(Date currentTime) {
        this.currentTime = currentTime;
    }

    public Long getPayChannel() {
        return payChannel;
    }

    public void setPayChannel(Long payChannel) {
        this.payChannel = payChannel;
    }

    public String getOrderStr() {
        return orderStr;
    }

    public void setOrderStr(String orderStr) {
        this.orderStr = orderStr;
    }

    @Override
    public String getRemark() {
        return remark;
    }

    @Override
    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getLogisticsCompany() {
        return logisticsCompany;
    }

    public void setLogisticsCompany(String logisticsCompany) {
        this.logisticsCompany = logisticsCompany;
    }

    public String getOrderStatusText() {
        return orderStatusText;
    }

    public void setOrderStatusText(String orderStatusText) {
        this.orderStatusText = orderStatusText;
    }

    public String getOrderTypeText() {
        return orderTypeText;
    }

    public void setOrderTypeText(String orderTypeText) {
        this.orderTypeText = orderTypeText;
    }

    public String getPayModeText() {
        return payModeText;
    }

    public void setPayModeText(String payModeText) {
        this.payModeText = payModeText;
    }

    public Long getActivityId() {
        return activityId;
    }

    public void setActivityId(Long activityId) {
        this.activityId = activityId;
    }

    public Integer getNum() {
        return num;
    }

    public void setNum(Integer num) {
        this.num = num;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getReceivingAddress() {
        return receivingAddress;
    }

    public void setReceivingAddress(String receivingAddress) {
        this.receivingAddress = receivingAddress;
    }

    public String getReceivingName() {
        return receivingName;
    }

    public void setReceivingName(String receivingName) {
        this.receivingName = receivingName;
    }

    public String getReceivingMobile() {
        return receivingMobile;
    }

    public void setReceivingMobile(String receivingMobile) {
        this.receivingMobile = receivingMobile;
    }

    public String getIntAreaCode() {
        return intAreaCode;
    }

    public void setIntAreaCode(String intAreaCode) {
        this.intAreaCode = intAreaCode;
    }

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setGoodsId(Long goodsId) 
    {
        this.goodsId = goodsId;
    }

    public Long getGoodsId() 
    {
        return goodsId;
    }

    public void setAddrId(Long addrId) 
    {
        this.addrId = addrId;
    }

    public Long getAddrId() 
    {
        return addrId;
    }

    public void setOrderNo(String orderNo) 
    {
        this.orderNo = orderNo;
    }

    public String getOrderNo() 
    {
        return orderNo;
    }

    public void setOrderStatus(Long orderStatus) 
    {
        this.orderStatus = orderStatus;
    }

    public Long getOrderStatus() 
    {
        return orderStatus;
    }

    public void setOrderType(Long orderType) 
    {
        this.orderType = orderType;
    }

    public Long getOrderType() 
    {
        return orderType;
    }

    public void setPayMode(Long payMode) 
    {
        this.payMode = payMode;
    }

    public Long getPayMode() 
    {
        return payMode;
    }

    public void setOrderDesc(String orderDesc) 
    {
        this.orderDesc = orderDesc;
    }

    public String getOrderDesc() 
    {
        return orderDesc;
    }

    public void setPrice(BigDecimal price) 
    {
        this.price = price;
    }

    public BigDecimal getPrice() 
    {
        return price;
    }

    public void setCreateById(Long createById) 
    {
        this.createById = createById;
    }

    public Long getCreateById() 
    {
        return createById;
    }

    public void setCreateByName(String createByName) 
    {
        this.createByName = createByName;
    }

    public String getCreateByName() 
    {
        return createByName;
    }

    public void setPayTime(Date payTime) 
    {
        this.payTime = payTime;
    }

    public Date getPayTime() 
    {
        return payTime;
    }

    public void setRefundTime(Date refundTime) 
    {
        this.refundTime = refundTime;
    }

    public Date getRefundTime() 
    {
        return refundTime;
    }

    public void setCancelTime(Date cancelTime) 
    {
        this.cancelTime = cancelTime;
    }

    public Date getCancelTime() 
    {
        return cancelTime;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("goodsId", getGoodsId())
            .append("addrId", getAddrId())
            .append("orderNo", getOrderNo())
            .append("orderStatus", getOrderStatus())
            .append("orderType", getOrderType())
            .append("payMode", getPayMode())
            .append("orderDesc", getOrderDesc())
            .append("price", getPrice())
            .append("createById", getCreateById())
            .append("createByName", getCreateByName())
            .append("createTime", getCreateTime())
            .append("payTime", getPayTime())
            .append("refundTime", getRefundTime())
            .append("cancelTime", getCancelTime())
            .toString();
    }
}
