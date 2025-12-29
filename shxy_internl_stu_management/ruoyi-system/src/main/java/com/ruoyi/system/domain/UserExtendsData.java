package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import org.apache.poi.hpsf.Decimal;

import java.math.BigDecimal;

/**
 * 用户数据扩展对象 user_extends_data
 * 
 * @author ruoyi
 * @date 2025-09-29
 */
public class UserExtendsData extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 用户user_id */
    @Excel(name = "用户user_id")
    private Long userId;

    /** 用户积分 */
    @Excel(name = "用户积分")
    private BigDecimal userPoint;

    private Long validityType;

    private Long status;

    private BigDecimal pointRate;

    public BigDecimal getPointRate() {
        return pointRate;
    }

    public void setPointRate(BigDecimal pointRate) {
        this.pointRate = pointRate;
    }

    public Long getValidityType() {
        return validityType;
    }

    public void setValidityType(Long validityType) {
        this.validityType = validityType;
    }

    public Long getStatus() {
        return status;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public void setUserId(Long userId)
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setUserPoint(BigDecimal userPoint)
    {
        this.userPoint = userPoint;
    }

    public BigDecimal getUserPoint()
    {
        return userPoint;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("userId", getUserId())
            .append("userPoint", getUserPoint())
            .toString();
    }
}
