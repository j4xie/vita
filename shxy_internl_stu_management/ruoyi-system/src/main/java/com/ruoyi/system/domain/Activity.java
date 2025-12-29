package com.ruoyi.system.domain;

import java.math.BigDecimal;
import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 活动对象 activity
 * 
 * @author ruoyi
 * @date 2025-08-13
 */
public class Activity extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 主键 */
    private Long id;

    /** 活动名称 */
    @Excel(name = "活动名称")
    private String name;

    /** 展示图 */
    @Excel(name = "展示图")
    private String icon;

    /** 活动开始时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "活动开始时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date startTime;

    /** 活动结束时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "活动结束时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date endTime;

    /** 活动地点 */
    @Excel(name = "活动地点")
    private String address;

    /** 报名人数 */
    @Excel(name = "报名人数")
    private int enrollment;

    /** 详情--富文本 */
    @Excel(name = "详情--富文本")
    private String detail;

    /** 报名开始时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "报名开始时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date signStartTime;

    /** 报名结束时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "报名结束时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date signEndTime;

    /** 时区 */
    @Excel(name = "时区")
    private String timeZone;

    /** 费用 */
    private BigDecimal price;

    /** 活动积分 */
    private BigDecimal point;

    /**
     * 活动类型
     * 1- 社交活动 (Social)
     * 2- 节日庆典 (Festival) - 文化活动相关
     * 3- 生活服务 (Service) - 如接机
     * 4- 志愿服务 (Volunteer) - 积累志愿时长
     * 5- 学术活动 (Academic)
     * 6- 职业发展 (Career)
     */
    private Integer actType;

    /** 模板id */
    private Long modelId;

    /** 模板名 */
    private String modelName;

    /** 表单模板的内容 */
    private String modelContent;

    /** 状态 */
    @Excel(name = "状态")
    private Long status;

    /** 可用状态：  -1不可用     1-可用 */
    @Excel(name = "可用状态：  -1不可用     1-可用")
    private Long enabled;

    /** 创建用户的id */
    @Excel(name = "创建用户的id")
    private Long createUserId;

    /** 创建用户的姓名 */
    @Excel(name = "创建用户的姓名")
    private String createName;

    /** 创建用户的昵称 */
    @Excel(name = "创建用户的昵称")
    private String createNickName;

    private Long userId;

    private int signStatus;

    // -1 未开始  1 已开始   2已结束
    private int type;

    /** 已报名人数 */
    private int registerCount;

    /** 部门ID */
    private Long deptId;

    /** 部门名称 */
    private String deptName;

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getModelContent() {
        return modelContent;
    }

    public void setModelContent(String modelContent) {
        this.modelContent = modelContent;
    }

    public Long getModelId() {
        return modelId;
    }

    public void setModelId(Long modelId) {
        this.modelId = modelId;
    }

    public BigDecimal getPoint() {
        return point;
    }

    public void setPoint(BigDecimal point) {
        this.point = point;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public String getDeptName() {
        return deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getActType() {
        return actType;
    }

    public void setActType(Integer actType) {
        this.actType = actType;
    }

    public int getRegisterCount() {
        return registerCount;
    }

    public void setRegisterCount(int registerCount) {
        this.registerCount = registerCount;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }

    public int getSignStatus() {
        return signStatus;
    }

    public void setSignStatus(int signStatus) {
        this.signStatus = signStatus;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCreateUserId() {
        return createUserId;
    }

    public void setCreateUserId(Long createUserId) {
        this.createUserId = createUserId;
    }

    public String getCreateName() {
        return createName;
    }

    public void setCreateName(String createName) {
        this.createName = createName;
    }

    public String getCreateNickName() {
        return createNickName;
    }

    public void setCreateNickName(String createNickName) {
        this.createNickName = createNickName;
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

    public void setIcon(String icon) 
    {
        this.icon = icon;
    }

    public String getIcon() 
    {
        return icon;
    }

    public void setStartTime(Date startTime) 
    {
        this.startTime = startTime;
    }

    public Date getStartTime() 
    {
        return startTime;
    }

    public void setEndTime(Date endTime) 
    {
        this.endTime = endTime;
    }

    public Date getEndTime() 
    {
        return endTime;
    }

    public void setAddress(String address) 
    {
        this.address = address;
    }

    public String getAddress() 
    {
        return address;
    }

    public void setDetail(String detail) 
    {
        this.detail = detail;
    }

    public String getDetail() 
    {
        return detail;
    }

    public void setSignStartTime(Date signStartTime) 
    {
        this.signStartTime = signStartTime;
    }

    public Date getSignStartTime() 
    {
        return signStartTime;
    }

    public void setSignEndTime(Date signEndTime) 
    {
        this.signEndTime = signEndTime;
    }

    public Date getSignEndTime() 
    {
        return signEndTime;
    }

    public void setStatus(Long status) 
    {
        this.status = status;
    }

    public Long getStatus() 
    {
        return status;
    }

    public void setEnabled(Long enabled) 
    {
        this.enabled = enabled;
    }

    public Long getEnabled() 
    {
        return enabled;
    }

    public int getEnrollment() {
        return enrollment;
    }

    public void setEnrollment(int enrollment) {
        this.enrollment = enrollment;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("name", getName())
            .append("icon", getIcon())
            .append("startTime", getStartTime())
            .append("endTime", getEndTime())
            .append("address", getAddress())
            .append("enrollment", getEnrollment())
            .append("detail", getDetail())
            .append("signStartTime", getSignStartTime())
            .append("signEndTime", getSignEndTime())
            .append("status", getStatus())
            .append("enabled", getEnabled())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
