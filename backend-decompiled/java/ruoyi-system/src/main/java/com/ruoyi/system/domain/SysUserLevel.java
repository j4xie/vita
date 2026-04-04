/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.system.domain.UserLevelExEquity;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysUserLevel
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u7b49\u7ea7\u540d\u79f0")
    private String levelName;
    private String logo;
    @Excel(name="\u4f1a\u5458\u6743\u76ca")
    private String memberBenefits;
    private Long[] equids;
    @Excel(name="\u662f\u5426\u53ef\u4ee5\u81ea\u52a8\u5347\u7ea7\u5230\u8be5\u7b49\u7ea7", readConverterExp="1=-\u53ef\u4ee5,-=1-\u4e0d\u53ef\u4ee5")
    private Long isUpgrade;
    @Excel(name="\u5347\u7ea7\u95e8\u69db")
    private Long limitValue;
    @Excel(name="\u5347\u7ea7\u95e8\u69db\u7c7b\u578b", readConverterExp="1=-\u79ef\u5206,2=-\u6d88\u8d39")
    private Long limitType;
    @Excel(name="\u6d88\u8d39\u83b7\u53d6\u79ef\u5206\u500d\u6570")
    private BigDecimal pointRate;
    private String acquisitionMethodType;
    private String acquisitionMethod;
    private int periodOfValidityType;
    private Date validityStartTime;
    private Date validityEndTime;
    private int validityNum;
    private int validityType;
    private BigDecimal price;
    @Excel(name="\u521b\u5efa\u8005user_id")
    private Long createByUserId;
    @Excel(name="\u521b\u5efa\u8005legal_name")
    private String createByName;
    @Excel(name="\u66f4\u65b0\u4ebalegal_name")
    private String updateByName;
    private List<UserLevelExEquity> userLevelExEquityList;

    public List<UserLevelExEquity> getUserLevelExEquityList() {
        return this.userLevelExEquityList;
    }

    public void setUserLevelExEquityList(List<UserLevelExEquity> userLevelExEquityList) {
        this.userLevelExEquityList = userLevelExEquityList;
    }

    public int getPeriodOfValidityType() {
        return this.periodOfValidityType;
    }

    public void setPeriodOfValidityType(int periodOfValidityType) {
        this.periodOfValidityType = periodOfValidityType;
    }

    public Date getValidityStartTime() {
        return this.validityStartTime;
    }

    public void setValidityStartTime(Date validityStartTime) {
        this.validityStartTime = validityStartTime;
    }

    public Date getValidityEndTime() {
        return this.validityEndTime;
    }

    public void setValidityEndTime(Date validityEndTime) {
        this.validityEndTime = validityEndTime;
    }

    public int getValidityNum() {
        return this.validityNum;
    }

    public void setValidityNum(int validityNum) {
        this.validityNum = validityNum;
    }

    public int getValidityType() {
        return this.validityType;
    }

    public void setValidityType(int validityType) {
        this.validityType = validityType;
    }

    public String getAcquisitionMethod() {
        return this.acquisitionMethod;
    }

    public void setAcquisitionMethod(String acquisitionMethod) {
        this.acquisitionMethod = acquisitionMethod;
    }

    public String getLogo() {
        return this.logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }

    public String getLevelName() {
        return this.levelName;
    }

    public void setMemberBenefits(String memberBenefits) {
        this.memberBenefits = memberBenefits;
    }

    public String getMemberBenefits() {
        return this.memberBenefits;
    }

    public void setIsUpgrade(Long isUpgrade) {
        this.isUpgrade = isUpgrade;
    }

    public Long getIsUpgrade() {
        return this.isUpgrade;
    }

    public void setLimitValue(Long limitValue) {
        this.limitValue = limitValue;
    }

    public Long getLimitValue() {
        return this.limitValue;
    }

    public void setLimitType(Long limitType) {
        this.limitType = limitType;
    }

    public Long getLimitType() {
        return this.limitType;
    }

    public void setPointRate(BigDecimal pointRate) {
        this.pointRate = pointRate;
    }

    public BigDecimal getPointRate() {
        return this.pointRate;
    }

    public void setCreateByUserId(Long createByUserId) {
        this.createByUserId = createByUserId;
    }

    public Long getCreateByUserId() {
        return this.createByUserId;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public String getCreateByName() {
        return this.createByName;
    }

    public String getUpdateByName() {
        return this.updateByName;
    }

    public void setUpdateByName(String updateByName) {
        this.updateByName = updateByName;
    }

    public String getAcquisitionMethodType() {
        return this.acquisitionMethodType;
    }

    public void setAcquisitionMethodType(String acquisitionMethodType) {
        this.acquisitionMethodType = acquisitionMethodType;
    }

    public Long[] getEquids() {
        return this.equids;
    }

    public void setEquids(Long[] equids) {
        this.equids = equids;
    }

    public BigDecimal getPrice() {
        return this.price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("levelName", (Object)this.getLevelName()).append("memberBenefits", (Object)this.getMemberBenefits()).append("isUpgrade", (Object)this.getIsUpgrade()).append("limitValue", (Object)this.getLimitValue()).append("limitType", (Object)this.getLimitType()).append("pointRate", (Object)this.getPointRate()).append("createTime", (Object)this.getCreateTime()).append("createByUserId", (Object)this.getCreateByUserId()).append("createByName", (Object)this.getCreateByName()).append("updateTime", (Object)this.getUpdateTime()).append("updateByName", (Object)this.getUpdateByName()).toString();
    }
}

