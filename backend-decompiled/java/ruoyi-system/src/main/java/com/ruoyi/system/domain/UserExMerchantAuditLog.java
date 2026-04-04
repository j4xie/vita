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
import java.util.Date;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class UserExMerchantAuditLog
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="${comment}", readConverterExp="$column.readConverterExp()")
    private Long merchantId;
    @Excel(name="\u64cd\u4f5c\u72b6\u6001\u7801")
    private Long operatStatus;
    @Excel(name="\u64cd\u4f5c\u540d\u79f0")
    private String operatName;
    @Excel(name="\u5907\u6ce8")
    private String operateRemark;
    @Excel(name="\u64cd\u4f5c\u4eba\u7684userid")
    private Long operateByUserId;
    @Excel(name="\u64cd\u4f5c\u4eba\u7684legalName")
    private String operateByName;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u64cd\u4f5c\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date operateTime;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setMerchantId(Long merchantId) {
        this.merchantId = merchantId;
    }

    public Long getMerchantId() {
        return this.merchantId;
    }

    public void setOperatStatus(Long operatStatus) {
        this.operatStatus = operatStatus;
    }

    public Long getOperatStatus() {
        return this.operatStatus;
    }

    public void setOperatName(String operatName) {
        this.operatName = operatName;
    }

    public String getOperatName() {
        return this.operatName;
    }

    public void setOperateRemark(String operateRemark) {
        this.operateRemark = operateRemark;
    }

    public String getOperateRemark() {
        return this.operateRemark;
    }

    public void setOperateByUserId(Long operateByUserId) {
        this.operateByUserId = operateByUserId;
    }

    public Long getOperateByUserId() {
        return this.operateByUserId;
    }

    public void setOperateByName(String operateByName) {
        this.operateByName = operateByName;
    }

    public String getOperateByName() {
        return this.operateByName;
    }

    public void setOperateTime(Date operateTime) {
        this.operateTime = operateTime;
    }

    public Date getOperateTime() {
        return this.operateTime;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("merchantId", (Object)this.getMerchantId()).append("operatStatus", (Object)this.getOperatStatus()).append("operatName", (Object)this.getOperatName()).append("operateRemark", (Object)this.getOperateRemark()).append("operateByUserId", (Object)this.getOperateByUserId()).append("operateByName", (Object)this.getOperateByName()).append("operateTime", (Object)this.getOperateTime()).toString();
    }
}

