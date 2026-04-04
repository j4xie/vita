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

public class VolunteerRecord
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="${comment}", readConverterExp="$column.readConverterExp()")
    private Long userId;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u7b7e\u5230\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date startTime;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u7b7e\u9000\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date endTime;
    @Excel(name="1 \u53ea\u7b7e\u5230       2 \u7b7e\u9000\u5b8c\u6210")
    private Long type;
    @Excel(name="-1 \u5f85\u5ba1\u6838     1 \u5ba1\u6838\u901a\u8fc7     2 \u5ba1\u6838\u62d2\u7edd")
    private Long status;
    @Excel(name="\u5907\u6ce8\u8bf4\u660e")
    private String remark;
    @Excel(name="\u64cd\u4f5c\u4eba\u7684\u7528\u6237id")
    private Long operateUserId;
    @Excel(name="\u64cd\u4f5c\u4eba\u6cd5\u5b9a\u59d3\u540d")
    private String operateLegalName;
    private String timeOffset;
    private String legalName;
    private Date createTime;
    private String auditLegalName;
    private Date auditTime;

    public String getTimeOffset() {
        return this.timeOffset;
    }

    public void setTimeOffset(String timeOffset) {
        this.timeOffset = timeOffset;
    }

    public String getAuditLegalName() {
        return this.auditLegalName;
    }

    public void setAuditLegalName(String auditLegalName) {
        this.auditLegalName = auditLegalName;
    }

    public Date getAuditTime() {
        return this.auditTime;
    }

    public void setAuditTime(Date auditTime) {
        this.auditTime = auditTime;
    }

    public Long getStatus() {
        return this.status;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public String getRemark() {
        return this.remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public Date getCreateTime() {
        return this.createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getStartTime() {
        return this.startTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public Date getEndTime() {
        return this.endTime;
    }

    public void setType(Long type) {
        this.type = type;
    }

    public Long getType() {
        return this.type;
    }

    public void setOperateUserId(Long operateUserId) {
        this.operateUserId = operateUserId;
    }

    public Long getOperateUserId() {
        return this.operateUserId;
    }

    public void setOperateLegalName(String operateLegalName) {
        this.operateLegalName = operateLegalName;
    }

    public String getOperateLegalName() {
        return this.operateLegalName;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("userId", (Object)this.getUserId()).append("startTime", (Object)this.getStartTime()).append("endTime", (Object)this.getEndTime()).append("type", (Object)this.getType()).append("operateUserId", (Object)this.getOperateUserId()).append("operateLegalName", (Object)this.getOperateLegalName()).toString();
    }
}

