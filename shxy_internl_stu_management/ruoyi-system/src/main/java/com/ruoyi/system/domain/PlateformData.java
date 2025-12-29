package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 平台设置对象 plateform_data
 * 
 * @author ruoyi
 * @date 2025-09-14
 */
public class PlateformData extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 主键 */
    private Long id;

    /** 内容key */
    @Excel(name = "内容key")
    private String dataKey;

    /** data值 */
    @Excel(name = "data值")
    private String dataValue;

    /** data描述 */
    @Excel(name = "data描述")
    private String dataDesc;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setDataKey(String dataKey) 
    {
        this.dataKey = dataKey;
    }

    public String getDataKey() 
    {
        return dataKey;
    }

    public void setDataValue(String dataValue) 
    {
        this.dataValue = dataValue;
    }

    public String getDataValue() 
    {
        return dataValue;
    }

    public void setDataDesc(String dataDesc) 
    {
        this.dataDesc = dataDesc;
    }

    public String getDataDesc() 
    {
        return dataDesc;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("dataKey", getDataKey())
            .append("dataValue", getDataValue())
            .append("dataDesc", getDataDesc())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
