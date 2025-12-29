package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 积分商品对象 mall_point_goods
 * 
 * @author ruoyi
 * @date 2025-09-15
 */
public class MallPointGoods extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 商品名称 */
    @Excel(name = "商品名称")
    private String goodName;

    /** 商品展示图 */
    @Excel(name = "商品展示图")
    private String goodIcon;

    /** 商品分类id*/
    @Excel(name = "商品分类id")
    private Long classifyId;

    /**
     * 分类名称
     */
    private String classifyName;

    /** 商品简介 */
    @Excel(name = "商品简介")
    private String goodDesc;

    /** 商品价格 */
    @Excel(name = "商品价格")
    private Long price;

    /** 库存数量 */
    @Excel(name = "库存数量")
    private Long quantity;

    /** 数量单位 */
    @Excel(name = "数量单位")
    private String unit;

    /** 商品详情 */
    @Excel(name = "商品详情")
    private String goodDetail;

    /** 创建人user_id */
    private Long createUserId;

    public Long getQuantity() {
        return quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getClassifyName() {
        return classifyName;
    }

    public void setClassifyName(String classifyName) {
        this.classifyName = classifyName;
    }

    public Long getCreateUserId() {
        return createUserId;
    }

    public void setCreateUserId(Long createUserId) {
        this.createUserId = createUserId;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setGoodName(String goodName) 
    {
        this.goodName = goodName;
    }

    public String getGoodName() 
    {
        return goodName;
    }

    public void setGoodIcon(String goodIcon) 
    {
        this.goodIcon = goodIcon;
    }

    public String getGoodIcon() 
    {
        return goodIcon;
    }

    public void setGoodDesc(String goodDesc) 
    {
        this.goodDesc = goodDesc;
    }

    public String getGoodDesc() 
    {
        return goodDesc;
    }

    public void setPrice(Long price) 
    {
        this.price = price;
    }

    public Long getPrice() 
    {
        return price;
    }

    public void setGoodDetail(String goodDetail) 
    {
        this.goodDetail = goodDetail;
    }

    public String getGoodDetail() 
    {
        return goodDetail;
    }

    public Long getClassifyId() {
        return classifyId;
    }

    public void setClassifyId(Long classifyId) {
        this.classifyId = classifyId;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("goodName", getGoodName())
            .append("goodIcon", getGoodIcon())
            .append("classifyId", getClassifyId())
            .append("goodDesc", getGoodDesc())
            .append("price", getPrice())
            .append("quantity", getQuantity())
            .append("unit", getUnit())
            .append("goodDetail", getGoodDetail())
            .append("createTime", getCreateTime())
            .append("createBy", getCreateBy())
            .append("createUserId", getCreateUserId())
            .append("updateTime", getUpdateTime())
            .append("updateBy", getUpdateBy())
            .toString();
    }
}
