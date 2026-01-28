package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 会员等级关联权益对象 user_level_ex_equity
 * 
 * @author ruoyi
 * @date 2026-01-28
 */
public class UserLevelExEquity extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 会员等级对应的id */
    @Excel(name = "会员等级对应的id")
    private Long levelId;

    /** 权益id */
    @Excel(name = "权益id")
    private Long equityId;

    /** 权益名称 */
    @Excel(name = "权益名称")
    private String equName;

    /** 权益标识 */
    @Excel(name = "权益标识")
    private String equTag;

    /** 排序 */
    @Excel(name = "排序")
    private Long equSort;

    public String getEquName() {
        return equName;
    }

    public void setEquName(String equName) {
        this.equName = equName;
    }

    public String getEquTag() {
        return equTag;
    }

    public void setEquTag(String equTag) {
        this.equTag = equTag;
    }

    public Long getEquSort() {
        return equSort;
    }

    public void setEquSort(Long equSort) {
        this.equSort = equSort;
    }

    public void setLevelId(Long levelId)
    {
        this.levelId = levelId;
    }

    public Long getLevelId() 
    {
        return levelId;
    }

    public void setEquityId(Long equityId) 
    {
        this.equityId = equityId;
    }

    public Long getEquityId() 
    {
        return equityId;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("levelId", getLevelId())
            .append("equityId", getEquityId())
            .append("createTime", getCreateTime())
            .toString();
    }
}
