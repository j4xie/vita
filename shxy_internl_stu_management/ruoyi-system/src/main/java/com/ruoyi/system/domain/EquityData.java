package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 核心权益管理对象 equity_data
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
public class EquityData extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 权益名称 */
    @Excel(name = "权益名称")
    private String equName;

    /** 权益标识 */
    @Excel(name = "权益标识")
    private String equTag;

    /** 启用状态：1-启用    -1-停用 */
    @Excel(name = "启用状态：1-启用    -1-停用")
    private Long equStatus;

    /** 排序 */
    @Excel(name = "排序")
    private Long equSort;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setEquName(String equName) 
    {
        this.equName = equName;
    }

    public String getEquName() 
    {
        return equName;
    }

    public void setEquTag(String equTag) 
    {
        this.equTag = equTag;
    }

    public String getEquTag() 
    {
        return equTag;
    }

    public void setEquStatus(Long equStatus) 
    {
        this.equStatus = equStatus;
    }

    public Long getEquStatus() 
    {
        return equStatus;
    }

    public void setEquSort(Long equSort) 
    {
        this.equSort = equSort;
    }

    public Long getEquSort() 
    {
        return equSort;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("equName", getEquName())
            .append("equTag", getEquTag())
            .append("equStatus", getEquStatus())
            .append("equSort", getEquSort())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
