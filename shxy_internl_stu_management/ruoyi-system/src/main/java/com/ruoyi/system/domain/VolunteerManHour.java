package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 志愿者总工时对象 volunteer_man_hour
 * 
 * @author ruoyi
 * @date 2025-08-16
 */
public class VolunteerManHour extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 用户id */
    @Excel(name = "用户id")
    private Long userId;

    /** 总工时 */
    @Excel(name = "总工时")
    private Long totalMinutes;

    private String legalName;

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setTotalMinutes(Long totalMinutes) 
    {
        this.totalMinutes = totalMinutes;
    }

    public Long getTotalMinutes() 
    {
        return totalMinutes;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("userId", getUserId())
            .append("totalMinutes", getTotalMinutes())
            .toString();
    }
}
