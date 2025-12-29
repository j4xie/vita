package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 【请填写功能名称】对象 activity_ex_user
 * 
 * @author ruoyi
 * @date 2025-08-14
 */
public class ActivityExUser extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 活动id */
    @Excel(name = "活动id")
    private Long activityId;

    /** 用户id */
    @Excel(name = "用户id")
    private Long userId;

    /** 签到状态（-1 未签到     1 已签到） */
    @Excel(name = "签到状态", readConverterExp = "-=1,未=签到,1=,已=签到")
    private Long signStatus;

    private String modelFormInfo;

    /** 状态（-1待付款   1正常） */
    private Long status;

    public String getModelFormInfo() {
        return modelFormInfo;
    }

    public void setModelFormInfo(String modelFormInfo) {
        this.modelFormInfo = modelFormInfo;
    }

    public Long getStatus() {
        return status;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public void setActivityId(Long activityId)
    {
        this.activityId = activityId;
    }

    public Long getActivityId() 
    {
        return activityId;
    }

    public void setUserId(Long userId) 
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setSignStatus(Long signStatus) 
    {
        this.signStatus = signStatus;
    }

    public Long getSignStatus() 
    {
        return signStatus;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("activityId", getActivityId())
            .append("userId", getUserId())
            .append("signStatus", getSignStatus())
            .toString();
    }
}
