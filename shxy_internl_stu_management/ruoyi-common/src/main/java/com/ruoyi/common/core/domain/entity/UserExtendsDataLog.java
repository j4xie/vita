package com.ruoyi.common.core.domain.entity;

import java.math.BigDecimal;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 用户数据积分等记录对象 user_extends_data_log
 * 
 * @author ruoyi
 * @date 2026-02-04
 */
public class UserExtendsDataLog extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 用户id */
    @Excel(name = "用户id")
    private Long userId;

    /** 变更内容 */
    @Excel(name = "变更内容")
    private String exPoint;

    /** 1-积分 */
    @Excel(name = "1-积分")
    private Long exType;

    private String exRemark;

    public String getExRemark() {
        return exRemark;
    }

    public void setExRemark(String exRemark) {
        this.exRemark = exRemark;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setExPoint(String exPoint)
    {
        this.exPoint = exPoint;
    }

    public String getExPoint()
    {
        return exPoint;
    }

    public void setExType(Long exType) 
    {
        this.exType = exType;
    }

    public Long getExType() 
    {
        return exType;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("userId", getUserId())
            .append("exPoint", getExPoint())
            .append("exType", getExType())
            .append("createTime", getCreateTime())
            .toString();
    }
}
