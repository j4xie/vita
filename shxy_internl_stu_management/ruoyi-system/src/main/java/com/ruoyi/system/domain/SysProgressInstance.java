package com.ruoyi.system.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 审批实例对象 sys_progress_instance
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
public class SysProgressInstance extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 流程模板id */
    @Excel(name = "流程模板id")
    private Long templateId;

    /** 审批标题 */
    @Excel(name = "审批标题")
    private String title;

    /** 提交表单数据 */
    @Excel(name = "提交表单数据")
    private String formData;

    /** 状态（1-审核中    2-审核通过   3-审核拒绝   4-已取消） */
    @Excel(name = "状态", readConverterExp = "1=-审核中,2=-审核通过,3=-审核拒绝,4=-已取消")
    private Long status;

    /** 类型（1-普通    2-加急） */
    @Excel(name = "类型", readConverterExp = "1=-普通,2=-加急")
    private Long urgency;

    /** 发起人user_id */
    @Excel(name = "发起人user_id")
    private Long promoterUserId;

    /** 发起人法定姓名 */
    @Excel(name = "发起人法定姓名")
    private String promoterLegalName;

    /** 当前审批节点id */
    @Excel(name = "当前审批节点id")
    private Long currentNodeId;

    /** 审核完成时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "审核完成时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date finishTime;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setTemplateId(Long templateId) 
    {
        this.templateId = templateId;
    }

    public Long getTemplateId() 
    {
        return templateId;
    }

    public void setTitle(String title) 
    {
        this.title = title;
    }

    public String getTitle() 
    {
        return title;
    }

    public void setFormData(String formData) 
    {
        this.formData = formData;
    }

    public String getFormData() 
    {
        return formData;
    }

    public void setStatus(Long status) 
    {
        this.status = status;
    }

    public Long getStatus() 
    {
        return status;
    }

    public void setUrgency(Long urgency) 
    {
        this.urgency = urgency;
    }

    public Long getUrgency() 
    {
        return urgency;
    }

    public void setPromoterUserId(Long promoterUserId) 
    {
        this.promoterUserId = promoterUserId;
    }

    public Long getPromoterUserId() 
    {
        return promoterUserId;
    }

    public void setPromoterLegalName(String promoterLegalName) 
    {
        this.promoterLegalName = promoterLegalName;
    }

    public String getPromoterLegalName() 
    {
        return promoterLegalName;
    }

    public void setCurrentNodeId(Long currentNodeId) 
    {
        this.currentNodeId = currentNodeId;
    }

    public Long getCurrentNodeId() 
    {
        return currentNodeId;
    }

    public void setFinishTime(Date finishTime) 
    {
        this.finishTime = finishTime;
    }

    public Date getFinishTime() 
    {
        return finishTime;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("templateId", getTemplateId())
            .append("title", getTitle())
            .append("formData", getFormData())
            .append("status", getStatus())
            .append("urgency", getUrgency())
            .append("promoterUserId", getPromoterUserId())
            .append("promoterLegalName", getPromoterLegalName())
            .append("currentNodeId", getCurrentNodeId())
            .append("finishTime", getFinishTime())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
