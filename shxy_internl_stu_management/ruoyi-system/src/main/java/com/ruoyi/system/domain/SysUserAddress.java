package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 收货地址对象 sys_user_address
 * 
 * @author ruoyi
 * @date 2025-10-11
 */
public class SysUserAddress extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 收件人姓名 */
    @Excel(name = "收件人姓名")
    private String name;

    /** 国家代码 */
    @Excel(name = "国家代码")
    private String intAreaCode;

    /** 收件人号码 */
    @Excel(name = "收件人号码")
    private String mobile;

    /** 地址 */
    @Excel(name = "地址")
    private String address;

    /** 详细地址 */
    @Excel(name = "详细地址")
    private String detailAddr;

    /** 经度 */
    @Excel(name = "经度")
    private String longitude;

    /** 纬度 */
    @Excel(name = "纬度")
    private String latitude;

    /** 是否默认地址（-1-否   1-是） */
    @Excel(name = "是否默认地址", readConverterExp = "-=1-否,1=-是")
    private Long isDefault;

    /** 创建用户的user_id */
    @Excel(name = "创建用户的user_id")
    private Long createById;

    /** 创建用户的法定姓名 */
    @Excel(name = "创建用户的法定姓名")
    private String createByName;

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

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }


    public void setName(String name) 
    {
        this.name = name;
    }

    public String getName() 
    {
        return name;
    }

    public void setIntAreaCode(String intAreaCode) 
    {
        this.intAreaCode = intAreaCode;
    }

    public String getIntAreaCode() 
    {
        return intAreaCode;
    }

    public void setMobile(String mobile) 
    {
        this.mobile = mobile;
    }

    public String getMobile() 
    {
        return mobile;
    }

    public void setAddress(String address) 
    {
        this.address = address;
    }

    public String getAddress() 
    {
        return address;
    }

    public void setDetailAddr(String detailAddr) 
    {
        this.detailAddr = detailAddr;
    }

    public String getDetailAddr() 
    {
        return detailAddr;
    }

    public void setLongitude(String longitude) 
    {
        this.longitude = longitude;
    }

    public String getLongitude() 
    {
        return longitude;
    }

    public void setLatitude(String latitude) 
    {
        this.latitude = latitude;
    }

    public String getLatitude() 
    {
        return latitude;
    }

    public void setIsDefault(Long isDefault) 
    {
        this.isDefault = isDefault;
    }

    public Long getIsDefault() 
    {
        return isDefault;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("name", getName())
            .append("intAreaCode", getIntAreaCode())
            .append("mobile", getMobile())
            .append("address", getAddress())
            .append("detailAddr", getDetailAddr())
            .append("longitude", getLongitude())
            .append("latitude", getLatitude())
            .append("isDefault", getIsDefault())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
