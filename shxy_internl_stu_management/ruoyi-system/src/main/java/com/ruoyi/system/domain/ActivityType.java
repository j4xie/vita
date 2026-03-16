package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 活动类型对象 activity_type
 * 
 * @author ruoyi
 * @date 2026-03-16
 */
public class ActivityType extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 类型名称 */
    @Excel(name = "类型名称")
    private String name;

    /** 标识 */
    @Excel(name = "标识")
    private String tag;

    /** 显示顺序 */
    @Excel(name = "显示顺序")
    private Long orderNum;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setName(String name) 
    {
        this.name = name;
    }

    public String getName() 
    {
        return name;
    }

    public void setTag(String tag) 
    {
        this.tag = tag;
    }

    public String getTag() 
    {
        return tag;
    }

    public void setOrderNum(Long orderNum) 
    {
        this.orderNum = orderNum;
    }

    public Long getOrderNum() 
    {
        return orderNum;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("name", getName())
            .append("tag", getTag())
            .append("orderNum", getOrderNum())
            .append("createTime", getCreateTime())
            .toString();
    }
}
