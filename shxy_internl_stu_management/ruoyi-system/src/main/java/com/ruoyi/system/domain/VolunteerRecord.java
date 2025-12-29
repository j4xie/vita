package com.ruoyi.system.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 志愿者打卡记录对象 volunteer_record
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
public class VolunteerRecord extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long userId;

    /** $column.columnComment */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "签到时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date startTime;

    /** $column.columnComment */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "签退时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date endTime;

    /** 1 只签到       2 签退完成 */
    @Excel(name = "1 只签到       2 签退完成")
    private Long type;

    /** 状态（-1：待审核     1：审核通过     2：审核拒绝） */
    @Excel(name = "-1 待审核     1 审核通过     2 审核拒绝")
    private Long status;

    /** 备注说明 */
    @Excel(name = "备注说明")
    private String remark;

    /** 操作人的用户id */
    @Excel(name = "操作人的用户id")
    private Long operateUserId;

    /** 操作人法定姓名 */
    @Excel(name = "操作人法定姓名")
    private String operateLegalName;

    /**
     * 和北京时间时差，比北京时间慢就传-号
     */
    private String timeOffset;

    private String legalName;

    private Date createTime;

    private String auditLegalName;

    private Date auditTime;

    public String getTimeOffset() {
        return timeOffset;
    }

    public void setTimeOffset(String timeOffset) {
        this.timeOffset = timeOffset;
    }

    public String getAuditLegalName() {
        return auditLegalName;
    }

    public void setAuditLegalName(String auditLegalName) {
        this.auditLegalName = auditLegalName;
    }

    public Date getAuditTime() {
        return auditTime;
    }

    public void setAuditTime(Date auditTime) {
        this.auditTime = auditTime;
    }

    public Long getStatus() {
        return status;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    @Override
    public String getRemark() {
        return remark;
    }

    @Override
    public void setRemark(String remark) {
        this.remark = remark;
    }

    @Override
    public Date getCreateTime() {
        return createTime;
    }

    @Override
    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setUserId(Long userId) 
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setStartTime(Date startTime) 
    {
        this.startTime = startTime;
    }

    public Date getStartTime() 
    {
        return startTime;
    }

    public void setEndTime(Date endTime) 
    {
        this.endTime = endTime;
    }

    public Date getEndTime() 
    {
        return endTime;
    }

    public void setType(Long type) 
    {
        this.type = type;
    }

    public Long getType() 
    {
        return type;
    }

    public void setOperateUserId(Long operateUserId) 
    {
        this.operateUserId = operateUserId;
    }

    public Long getOperateUserId() 
    {
        return operateUserId;
    }

    public void setOperateLegalName(String operateLegalName) 
    {
        this.operateLegalName = operateLegalName;
    }

    public String getOperateLegalName() 
    {
        return operateLegalName;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("userId", getUserId())
            .append("startTime", getStartTime())
            .append("endTime", getEndTime())
            .append("type", getType())
            .append("operateUserId", getOperateUserId())
            .append("operateLegalName", getOperateLegalName())
            .toString();
    }
}
