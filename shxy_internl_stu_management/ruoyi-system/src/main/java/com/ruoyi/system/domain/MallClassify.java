package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 商品分类对象 mall_classify
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
public class MallClassify extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 分类名称 */
    @Excel(name = "分类名称")
    private String catName;

    /** 分类图标 */
    @Excel(name = "分类图标")
    private String catImg;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setCatName(String catName) 
    {
        this.catName = catName;
    }

    public String getCatName() 
    {
        return catName;
    }

    public void setCatImg(String catImg) 
    {
        this.catImg = catImg;
    }

    public String getCatImg() 
    {
        return catImg;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("catName", getCatName())
            .append("catImg", getCatImg())
            .append("createTime", getCreateTime())
            .append("createBy", getCreateBy())
            .append("updateTime", getUpdateTime())
            .append("updateBy", getUpdateBy())
            .toString();
    }
}
