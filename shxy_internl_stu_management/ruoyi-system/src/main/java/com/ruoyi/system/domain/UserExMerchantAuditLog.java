package com.ruoyi.system.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 商户审核日志对象 user_ex_merchant_audit_log
 * 
 * @author ruoyi
 * @date 2025-09-16
 */
public class UserExMerchantAuditLog extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long merchantId;

    /** 操作状态码 */
    @Excel(name = "操作状态码")
    private Long operatStatus;

    /** 操作名称 */
    @Excel(name = "操作名称")
    private String operatName;

    /** 备注 */
    @Excel(name = "备注")
    private String operateRemark;

    /** 操作人的userid */
    @Excel(name = "操作人的userid")
    private Long operateByUserId;

    /** 操作人的legalName */
    @Excel(name = "操作人的legalName")
    private String operateByName;

    /** 操作时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "操作时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date operateTime;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setMerchantId(Long merchantId) 
    {
        this.merchantId = merchantId;
    }

    public Long getMerchantId() 
    {
        return merchantId;
    }

    public void setOperatStatus(Long operatStatus) 
    {
        this.operatStatus = operatStatus;
    }

    public Long getOperatStatus() 
    {
        return operatStatus;
    }

    public void setOperatName(String operatName) 
    {
        this.operatName = operatName;
    }

    public String getOperatName() 
    {
        return operatName;
    }

    public void setOperateRemark(String operateRemark) 
    {
        this.operateRemark = operateRemark;
    }

    public String getOperateRemark() 
    {
        return operateRemark;
    }

    public void setOperateByUserId(Long operateByUserId) 
    {
        this.operateByUserId = operateByUserId;
    }

    public Long getOperateByUserId() 
    {
        return operateByUserId;
    }

    public void setOperateByName(String operateByName) 
    {
        this.operateByName = operateByName;
    }

    public String getOperateByName() 
    {
        return operateByName;
    }

    public void setOperateTime(Date operateTime) 
    {
        this.operateTime = operateTime;
    }

    public Date getOperateTime() 
    {
        return operateTime;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("merchantId", getMerchantId())
            .append("operatStatus", getOperatStatus())
            .append("operatName", getOperatName())
            .append("operateRemark", getOperateRemark())
            .append("operateByUserId", getOperateByUserId())
            .append("operateByName", getOperateByName())
            .append("operateTime", getOperateTime())
            .toString();
    }
}
