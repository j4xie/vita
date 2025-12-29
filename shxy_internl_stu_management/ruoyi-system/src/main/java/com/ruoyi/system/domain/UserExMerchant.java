package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 商户对象 user_ex_merchant
 * 
 * @author ruoyi
 * @date 2025-09-10
 */
public class UserExMerchant extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** user表的id */
    @Excel(name = "user表的id")
    private Long userId;

    /** 商户名称 */
    @Excel(name = "商户名称")
    private String merchantName;

    /** 商户英文名称 */
    @Excel(name = "商户英文名称")
    private String merchantEnName;

    /** 商户LOGO图 */
    @Excel(name = "商户LOGO图")
    private String logo;

    /** 门店图 */

    @Excel(name = "门店图")
    private String shopImg;

    /** 商户简介 */
    @Excel(name = "商户简介")
    private String merchantDesc;

    /** 店铺地址 */
    @Excel(name = "店铺地址")
    private String merchantAddress;

    /** （雇主识别号）作为企业税务编号 */
    @Excel(name = "雇主识别号")
    private String ein;

    /** 法人身份证 */
    @Excel(name = "法人身份证")
    private String legalPerCard;

    /** 对公对私（-1：对私    1：对公） */
    @Excel(name = "对公对私", readConverterExp = "-=1：对私,1=：对公")
    private Long merchantType;

    /** 开户名称 */
    @Excel(name = "开户名称")
    private String accountName;

    /** 银行账户 */
    @Excel(name = "银行账户")
    private String bankAccount;

    /** 开户行 */
    @Excel(name = "开户行")
    private String openingBank;

    /** 社会保障号 */
    @Excel(name = "社会保障号")
    private String ssn;

    /** 路由号 */
    @Excel(name = "路由号")
    private String rn;

    /** 收款人名称 */
    @Excel(name = "收款人名称")
    private String acHolderName;

    /** 邮编 */
    @Excel(name = "邮编")
    private String zipcode;

    /** 营业执照图 */
    @Excel(name = "营业执照图")
    private String businessLicense;

    /** 许可证图 */
    @Excel(name = "许可证图")
    private String permitLicense;

    /** 主体类型（1-个人   2-公司） */
    @Excel(name = "主体类型")
    private int principalType;

    /** 学校id */
    private Long deptId;

    private String deptName;

    /** 状态（-1：冻结   1：待审核    2：审核拒绝     3：审核通过） */
    @Excel(name = "状态", readConverterExp = "-=1：冻结,1=：待审核,2=：审核拒绝,3=：审核通过")
    private Long status;

    /** 经度 */
    private String longitude;

    /** 纬度 */
    private String latitude;

    /** 用户账号 */
    @Excel(name = "登录名称")
    private String userName;

    /** 密码 */
    private String password;

    /** 法定姓名 */
    @Excel(name = "法定姓名")
    private String legalName;

    /**
     * 审核拒绝原因
     */
    private String reason;

    /** 手机号码 */
    @Excel(name = "手机号码", cellType = Excel.ColumnType.TEXT)
    private String phonenumber;

    /** 用户邮箱 */
    @Excel(name = "用户邮箱")
    private String email;

    private Long createById;

    private String createByName;

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public String getDeptName() {
        return deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public String getMerchantEnName() {
        return merchantEnName;
    }

    public void setMerchantEnName(String merchantEnName) {
        this.merchantEnName = merchantEnName;
    }

    public int getPrincipalType() {
        return principalType;
    }

    public void setPrincipalType(int principalType) {
        this.principalType = principalType;
    }

    public Long getCreateById() {
        return createById;
    }

    public void setCreateById(Long createById) {
        this.createById = createById;
    }

    public String getCreateByName() {
        return createByName;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public String getZipcode() {
        return zipcode;
    }

    public void setZipcode(String zipcode) {
        this.zipcode = zipcode;
    }

    public String getPhonenumber() {
        return phonenumber;
    }

    public void setPhonenumber(String phonenumber) {
        this.phonenumber = phonenumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


    public String getAcHolderName() {
        return acHolderName;
    }

    public void setAcHolderName(String acHolderName) {
        this.acHolderName = acHolderName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getShopImg() {
        return shopImg;
    }

    public void setShopImg(String shopImg) {
        this.shopImg = shopImg;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

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

    public void setMerchantName(String merchantName) 
    {
        this.merchantName = merchantName;
    }

    public String getMerchantName() 
    {
        return merchantName;
    }

    public void setLogo(String logo) 
    {
        this.logo = logo;
    }

    public String getLogo() 
    {
        return logo;
    }

    public String getMerchantDesc() {
        return merchantDesc;
    }

    public void setMerchantDesc(String merchantDesc) {
        this.merchantDesc = merchantDesc;
    }

    public void setMerchantAddress(String merchantAddress)
    {
        this.merchantAddress = merchantAddress;
    }

    public String getMerchantAddress() 
    {
        return merchantAddress;
    }


    public void setLegalPerCard(String legalPerCard)
    {
        this.legalPerCard = legalPerCard;
    }

    public String getLegalPerCard() 
    {
        return legalPerCard;
    }

    public void setMerchantType(Long merchantType) 
    {
        this.merchantType = merchantType;
    }

    public Long getMerchantType() 
    {
        return merchantType;
    }

    public void setAccountName(String accountName) 
    {
        this.accountName = accountName;
    }

    public String getAccountName() 
    {
        return accountName;
    }

    public void setBankAccount(String bankAccount) 
    {
        this.bankAccount = bankAccount;
    }

    public String getBankAccount() 
    {
        return bankAccount;
    }

    public void setOpeningBank(String openingBank) 
    {
        this.openingBank = openingBank;
    }

    public String getOpeningBank() 
    {
        return openingBank;
    }


    public void setBusinessLicense(String businessLicense)
    {
        this.businessLicense = businessLicense;
    }

    public String getBusinessLicense() 
    {
        return businessLicense;
    }

    public void setPermitLicense(String permitLicense) 
    {
        this.permitLicense = permitLicense;
    }

    public String getPermitLicense() 
    {
        return permitLicense;
    }

    public void setStatus(Long status) 
    {
        this.status = status;
    }

    public Long getStatus() 
    {
        return status;
    }

    public String getEin() {
        return ein;
    }

    public void setEin(String ein) {
        this.ein = ein;
    }

    public String getSsn() {
        return ssn;
    }

    public void setSsn(String ssn) {
        this.ssn = ssn;
    }

    public String getRn() {
        return rn;
    }

    public void setRn(String rn) {
        this.rn = rn;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("userId", getUserId())
            .append("merchantName", getMerchantName())
            .append("logo", getLogo())
            .append("merchantDesc", getMerchantDesc())
            .append("merchantAddress", getMerchantAddress())
            .append("ein", getEin())
            .append("legalPerCard", getLegalPerCard())
            .append("merchantType", getMerchantType())
            .append("accountName", getAccountName())
            .append("bankAccount", getBankAccount())
            .append("openingBank", getOpeningBank())
            .append("ssn", getSsn())
            .append("rn", getRn())
            .append("businessLicense", getBusinessLicense())
            .append("permitLicense", getPermitLicense())
            .append("principalType", getPrincipalType())
            .append("status", getStatus())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
