package com.ruoyi.system.domain;

import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 会员等级对象 sys_user_level
 * 
 * @author ruoyi
 * @date 2025-09-19
 */
public class SysUserLevel extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 等级名称 */
    @Excel(name = "等级名称")
    private String levelName;

    private String logo;

    /** 会员权益 */
    @Excel(name = "会员权益")
    private String memberBenefits;

    /** 是否可以自动升级到该等级（1-可以    -1-不可以） */
    @Excel(name = "是否可以自动升级到该等级", readConverterExp = "1=-可以,-=1-不可以")
    private Long isUpgrade;

    /** 升级门槛 */
    @Excel(name = "升级门槛")
    private Long limitValue;

    /** 升级门槛类型（1-积分    2-消费） */
    @Excel(name = "升级门槛类型", readConverterExp = "1=-积分,2=-消费")
    private Long limitType;

    /** 消费获取积分倍数 */
    @Excel(name = "消费获取积分倍数")
    private BigDecimal pointRate;

    private String acquisitionMethodType;

    /**
     * 获取资格
     */
    private String acquisitionMethod;

    /** 创建者user_id */
    @Excel(name = "创建者user_id")
    private Long createByUserId;

    /** 创建者legal_name */
    @Excel(name = "创建者legal_name")
    private String createByName;

    /** 更新人legal_name */
    @Excel(name = "更新人legal_name")
    private String updateByName;

    public String getAcquisitionMethod() {
        return acquisitionMethod;
    }

    public void setAcquisitionMethod(String acquisitionMethod) {
        this.acquisitionMethod = acquisitionMethod;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setLevelName(String levelName) 
    {
        this.levelName = levelName;
    }

    public String getLevelName() 
    {
        return levelName;
    }

    public void setMemberBenefits(String memberBenefits) 
    {
        this.memberBenefits = memberBenefits;
    }

    public String getMemberBenefits() 
    {
        return memberBenefits;
    }

    public void setIsUpgrade(Long isUpgrade) 
    {
        this.isUpgrade = isUpgrade;
    }

    public Long getIsUpgrade() 
    {
        return isUpgrade;
    }

    public void setLimitValue(Long limitValue) 
    {
        this.limitValue = limitValue;
    }

    public Long getLimitValue() 
    {
        return limitValue;
    }

    public void setLimitType(Long limitType) 
    {
        this.limitType = limitType;
    }

    public Long getLimitType() 
    {
        return limitType;
    }

    public void setPointRate(BigDecimal pointRate) 
    {
        this.pointRate = pointRate;
    }

    public BigDecimal getPointRate() 
    {
        return pointRate;
    }

    public void setCreateByUserId(Long createByUserId) 
    {
        this.createByUserId = createByUserId;
    }

    public Long getCreateByUserId() 
    {
        return createByUserId;
    }

    public void setCreateByName(String createByName) 
    {
        this.createByName = createByName;
    }

    public String getCreateByName() 
    {
        return createByName;
    }

    public String getUpdateByName() {
        return updateByName;
    }

    public void setUpdateByName(String updateByName) {
        this.updateByName = updateByName;
    }

    public String getAcquisitionMethodType() {
        return acquisitionMethodType;
    }

    public void setAcquisitionMethodType(String acquisitionMethodType) {
        this.acquisitionMethodType = acquisitionMethodType;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("levelName", getLevelName())
            .append("memberBenefits", getMemberBenefits())
            .append("isUpgrade", getIsUpgrade())
            .append("limitValue", getLimitValue())
            .append("limitType", getLimitType())
            .append("pointRate", getPointRate())
            .append("createTime", getCreateTime())
            .append("createByUserId", getCreateByUserId())
            .append("createByName", getCreateByName())
            .append("updateTime", getUpdateTime())
            .append("updateByName", getUpdateByName())
            .toString();
    }
}
