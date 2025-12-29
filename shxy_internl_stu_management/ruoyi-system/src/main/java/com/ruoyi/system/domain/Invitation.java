package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 邀请码对象 invitation
 * 
 * @author ruoyi
 * @date 2025-08-18
 */
public class Invitation extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** userId */
    @Excel(name = "userId")
    private Long userId;

    /** 邀请码 */
    @Excel(name = "邀请码")
    private String invCode;

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

    public void setInvCode(String invCode) 
    {
        this.invCode = invCode;
    }

    public String getInvCode() 
    {
        return invCode;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("userId", getUserId())
            .append("invCode", getInvCode())
            .toString();
    }
}
