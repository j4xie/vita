package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * AI常用问题对象 ai_normal_question
 * 
 * @author ruoyi
 * @date 2025-10-17
 */
public class AiNormalQuestion extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 问题内容 */
    @Excel(name = "问题内容")
    private String message;

    /** 创建人user_id */
    @Excel(name = "创建人user_id")
    private Long createById;

    private String createByName;

    public String getCreateByName() {
        return createByName;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setMessage(String message) 
    {
        this.message = message;
    }

    public String getMessage() 
    {
        return message;
    }

    public void setCreateById(Long createById) 
    {
        this.createById = createById;
    }

    public Long getCreateById() 
    {
        return createById;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("message", getMessage())
            .append("createById", getCreateById())
            .append("createTime", getCreateTime())
            .toString();
    }
}
