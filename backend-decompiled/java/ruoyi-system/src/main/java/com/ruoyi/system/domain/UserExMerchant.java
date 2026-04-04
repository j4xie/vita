/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.annotation.Excel$ColumnType
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class UserExMerchant
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="user\u8868\u7684id")
    private Long userId;
    @Excel(name="\u5546\u6237\u540d\u79f0")
    private String merchantName;
    @Excel(name="\u5546\u6237\u82f1\u6587\u540d\u79f0")
    private String merchantEnName;
    @Excel(name="\u5546\u6237LOGO\u56fe")
    private String logo;
    @Excel(name="\u95e8\u5e97\u56fe")
    private String shopImg;
    @Excel(name="\u5546\u6237\u7b80\u4ecb")
    private String merchantDesc;
    @Excel(name="\u5e97\u94fa\u5730\u5740")
    private String merchantAddress;
    @Excel(name="\u96c7\u4e3b\u8bc6\u522b\u53f7")
    private String ein;
    @Excel(name="\u6cd5\u4eba\u8eab\u4efd\u8bc1")
    private String legalPerCard;
    @Excel(name="\u5bf9\u516c\u5bf9\u79c1", readConverterExp="-=1\uff1a\u5bf9\u79c1,1=\uff1a\u5bf9\u516c")
    private Long merchantType;
    @Excel(name="\u5f00\u6237\u540d\u79f0")
    private String accountName;
    @Excel(name="\u94f6\u884c\u8d26\u6237")
    private String bankAccount;
    @Excel(name="\u5f00\u6237\u884c")
    private String openingBank;
    @Excel(name="\u793e\u4f1a\u4fdd\u969c\u53f7")
    private String ssn;
    @Excel(name="\u8def\u7531\u53f7")
    private String rn;
    @Excel(name="\u6536\u6b3e\u4eba\u540d\u79f0")
    private String acHolderName;
    @Excel(name="\u90ae\u7f16")
    private String zipcode;
    @Excel(name="\u8425\u4e1a\u6267\u7167\u56fe")
    private String businessLicense;
    @Excel(name="\u8bb8\u53ef\u8bc1\u56fe")
    private String permitLicense;
    @Excel(name="\u4e3b\u4f53\u7c7b\u578b")
    private int principalType;
    private Long deptId;
    private String deptName;
    @Excel(name="\u72b6\u6001", readConverterExp="-=1\uff1a\u51bb\u7ed3,1=\uff1a\u5f85\u5ba1\u6838,2=\uff1a\u5ba1\u6838\u62d2\u7edd,3=\uff1a\u5ba1\u6838\u901a\u8fc7")
    private Long status;
    private String longitude;
    private String latitude;
    @Excel(name="\u767b\u5f55\u540d\u79f0")
    private String userName;
    private String password;
    @Excel(name="\u6cd5\u5b9a\u59d3\u540d")
    private String legalName;
    private String reason;
    @Excel(name="\u624b\u673a\u53f7\u7801", cellType=Excel.ColumnType.TEXT)
    private String phonenumber;
    @Excel(name="\u7528\u6237\u90ae\u7bb1")
    private String email;
    private Long createById;
    private String createByName;
    private int weightLevel;

    public int getWeightLevel() {
        return this.weightLevel;
    }

    public void setWeightLevel(int weightLevel) {
        this.weightLevel = weightLevel;
    }

    public String getLongitude() {
        return this.longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getLatitude() {
        return this.latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public String getDeptName() {
        return this.deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public Long getDeptId() {
        return this.deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public String getMerchantEnName() {
        return this.merchantEnName;
    }

    public void setMerchantEnName(String merchantEnName) {
        this.merchantEnName = merchantEnName;
    }

    public int getPrincipalType() {
        return this.principalType;
    }

    public void setPrincipalType(int principalType) {
        this.principalType = principalType;
    }

    public Long getCreateById() {
        return this.createById;
    }

    public void setCreateById(Long createById) {
        this.createById = createById;
    }

    public String getCreateByName() {
        return this.createByName;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public String getZipcode() {
        return this.zipcode;
    }

    public void setZipcode(String zipcode) {
        this.zipcode = zipcode;
    }

    public String getPhonenumber() {
        return this.phonenumber;
    }

    public void setPhonenumber(String phonenumber) {
        this.phonenumber = phonenumber;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAcHolderName() {
        return this.acHolderName;
    }

    public void setAcHolderName(String acHolderName) {
        this.acHolderName = acHolderName;
    }

    public String getReason() {
        return this.reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getShopImg() {
        return this.shopImg;
    }

    public void setShopImg(String shopImg) {
        this.shopImg = shopImg;
    }

    public String getUserName() {
        return this.userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getLegalName() {
        return this.legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public String getMerchantName() {
        return this.merchantName;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public String getLogo() {
        return this.logo;
    }

    public String getMerchantDesc() {
        return this.merchantDesc;
    }

    public void setMerchantDesc(String merchantDesc) {
        this.merchantDesc = merchantDesc;
    }

    public void setMerchantAddress(String merchantAddress) {
        this.merchantAddress = merchantAddress;
    }

    public String getMerchantAddress() {
        return this.merchantAddress;
    }

    public void setLegalPerCard(String legalPerCard) {
        this.legalPerCard = legalPerCard;
    }

    public String getLegalPerCard() {
        return this.legalPerCard;
    }

    public void setMerchantType(Long merchantType) {
        this.merchantType = merchantType;
    }

    public Long getMerchantType() {
        return this.merchantType;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public String getAccountName() {
        return this.accountName;
    }

    public void setBankAccount(String bankAccount) {
        this.bankAccount = bankAccount;
    }

    public String getBankAccount() {
        return this.bankAccount;
    }

    public void setOpeningBank(String openingBank) {
        this.openingBank = openingBank;
    }

    public String getOpeningBank() {
        return this.openingBank;
    }

    public void setBusinessLicense(String businessLicense) {
        this.businessLicense = businessLicense;
    }

    public String getBusinessLicense() {
        return this.businessLicense;
    }

    public void setPermitLicense(String permitLicense) {
        this.permitLicense = permitLicense;
    }

    public String getPermitLicense() {
        return this.permitLicense;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public Long getStatus() {
        return this.status;
    }

    public String getEin() {
        return this.ein;
    }

    public void setEin(String ein) {
        this.ein = ein;
    }

    public String getSsn() {
        return this.ssn;
    }

    public void setSsn(String ssn) {
        this.ssn = ssn;
    }

    public String getRn() {
        return this.rn;
    }

    public void setRn(String rn) {
        this.rn = rn;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("userId", (Object)this.getUserId()).append("merchantName", (Object)this.getMerchantName()).append("logo", (Object)this.getLogo()).append("merchantDesc", (Object)this.getMerchantDesc()).append("merchantAddress", (Object)this.getMerchantAddress()).append("ein", (Object)this.getEin()).append("legalPerCard", (Object)this.getLegalPerCard()).append("merchantType", (Object)this.getMerchantType()).append("accountName", (Object)this.getAccountName()).append("bankAccount", (Object)this.getBankAccount()).append("openingBank", (Object)this.getOpeningBank()).append("ssn", (Object)this.getSsn()).append("rn", (Object)this.getRn()).append("businessLicense", (Object)this.getBusinessLicense()).append("permitLicense", (Object)this.getPermitLicense()).append("principalType", this.getPrincipalType()).append("status", (Object)this.getStatus()).append("createTime", (Object)this.getCreateTime()).append("updateTime", (Object)this.getUpdateTime()).toString();
    }
}

