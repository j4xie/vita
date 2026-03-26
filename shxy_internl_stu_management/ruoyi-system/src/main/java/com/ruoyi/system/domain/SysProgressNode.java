package com.ruoyi.system.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 流程节点对象 sys_progress_node
 * 
 * @author ruoyi
 * @date 2026-03-25
 */
public class SysProgressNode extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 流程实例的id */
    @Excel(name = "流程实例的id")
    private Long instanceId;

    /** 节点类型 */
    @Excel(name = "节点类型")
    private String type;

    /** all-会签    or-或签 */
    @Excel(name = "all-会签    or-或签")
    private String multiMode;

    /** 内容 */
    @Excel(name = "内容")
    private String content;

    /** 节点状态（1-待审核   2-审核通过   3-审核驳回） */
    @Excel(name = "节点状态", readConverterExp = "1=-待审核,2=-审核通过,3=-审核驳回")
    private Long status;

    /** 节点顺序 */
    @Excel(name = "节点顺序")
    private Long orderNum;

    /** 完成时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "完成时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date finishTime;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setInstanceId(Long instanceId) 
    {
        this.instanceId = instanceId;
    }

    public Long getInstanceId() 
    {
        return instanceId;
    }

    public void setType(String type) 
    {
        this.type = type;
    }

    public String getType() 
    {
        return type;
    }

    public void setMultiMode(String multiMode) 
    {
        this.multiMode = multiMode;
    }

    public String getMultiMode() 
    {
        return multiMode;
    }

    public void setContent(String content) 
    {
        this.content = content;
    }

    public String getContent() 
    {
        return content;
    }

    public void setStatus(Long status) 
    {
        this.status = status;
    }

    public Long getStatus() 
    {
        return status;
    }

    public void setOrderNum(Long orderNum) 
    {
        this.orderNum = orderNum;
    }

    public Long getOrderNum() 
    {
        return orderNum;
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
            .append("instanceId", getInstanceId())
            .append("type", getType())
            .append("multiMode", getMultiMode())
            .append("content", getContent())
            .append("status", getStatus())
            .append("orderNum", getOrderNum())
            .append("finishTime", getFinishTime())
            .append("createTime", getCreateTime())
            .toString();
    }
}
