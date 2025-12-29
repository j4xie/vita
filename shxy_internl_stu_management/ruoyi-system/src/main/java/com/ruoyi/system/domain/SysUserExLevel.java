package com.ruoyi.system.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 用户对应会员等级对象 sys_user_ex_level
 * 
 * @author ruoyi
 * @date 2025-09-21
 */
public class SysUserExLevel extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 用户表user_id */
    @Excel(name = "用户表user_id")
    private Long userId;

    /** 会员等级表level_id */
    @Excel(name = "会员等级表level_id")
    private Long levelId;

    /** 会员等级时效性（1-永久    -1-临时） */
    @Excel(name = "会员等级时效性", readConverterExp = "1=-永久,-=1-临时")
    private Long validityType;

    /** 状态（1-正常   -1-失效） */
    @Excel(name = "状态", readConverterExp = "1=-正常,-=1-失效")
    private Long status;

    /** 有效期起始时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "有效期起始时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date validityStartTime;

    /** 有效期结束时间 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "有效期结束时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date validityEndTime;

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

    public void setLevelId(Long levelId) 
    {
        this.levelId = levelId;
    }

    public Long getLevelId() 
    {
        return levelId;
    }

    public void setValidityType(Long validityType) 
    {
        this.validityType = validityType;
    }

    public Long getValidityType() 
    {
        return validityType;
    }

    public void setStatus(Long status) 
    {
        this.status = status;
    }

    public Long getStatus() 
    {
        return status;
    }

    public void setValidityStartTime(Date validityStartTime) 
    {
        this.validityStartTime = validityStartTime;
    }

    public Date getValidityStartTime() 
    {
        return validityStartTime;
    }

    public void setValidityEndTime(Date validityEndTime) 
    {
        this.validityEndTime = validityEndTime;
    }

    public Date getValidityEndTime() 
    {
        return validityEndTime;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("userId", getUserId())
            .append("levelId", getLevelId())
            .append("validityType", getValidityType())
            .append("status", getStatus())
            .append("validityStartTime", getValidityStartTime())
            .append("validityEndTime", getValidityEndTime())
            .append("createTime", getCreateTime())
            .toString();
    }
}
