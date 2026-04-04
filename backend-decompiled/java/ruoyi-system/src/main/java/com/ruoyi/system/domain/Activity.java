/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonFormat
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import java.math.BigDecimal;
import java.util.Date;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class Activity
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u6d3b\u52a8\u540d\u79f0")
    private String name;
    @Excel(name="\u5c55\u793a\u56fe")
    private String icon;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u6d3b\u52a8\u5f00\u59cb\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date startTime;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u6d3b\u52a8\u7ed3\u675f\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date endTime;
    @Excel(name="\u6d3b\u52a8\u5730\u70b9")
    private String address;
    @Excel(name="\u62a5\u540d\u4eba\u6570")
    private int enrollment;
    @Excel(name="\u8be6\u60c5--\u5bcc\u6587\u672c")
    private String detail;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u62a5\u540d\u5f00\u59cb\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date signStartTime;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u62a5\u540d\u7ed3\u675f\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date signEndTime;
    @Excel(name="\u65f6\u533a")
    private String timeZone;
    private BigDecimal price;
    private BigDecimal point;
    private BigDecimal sharePoint;
    private Integer actType;
    private Long modelId;
    private String modelName;
    private String modelContent;
    @Excel(name="\u72b6\u6001")
    private Long status;
    @Excel(name="\u53ef\u7528\u72b6\u6001\uff1a  -1\u4e0d\u53ef\u7528     1-\u53ef\u7528")
    private Long enabled;
    @Excel(name="\u521b\u5efa\u7528\u6237\u7684id")
    private Long createUserId;
    @Excel(name="\u521b\u5efa\u7528\u6237\u7684\u59d3\u540d")
    private String createName;
    @Excel(name="\u521b\u5efa\u7528\u6237\u7684\u6635\u79f0")
    private String createNickName;
    private Long userId;
    private int signStatus;
    private int type;
    private int registerCount;
    private Long deptId;
    private String deptName;
    private String deptIds;
    private String accessPermission;
    private String accessRoleKey;
    private String typeName;

    public String getTypeName() {
        return this.typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public BigDecimal getSharePoint() {
        return this.sharePoint;
    }

    public void setSharePoint(BigDecimal sharePoint) {
        this.sharePoint = sharePoint;
    }

    public String getAccessRoleKey() {
        return this.accessRoleKey;
    }

    public void setAccessRoleKey(String accessRoleKey) {
        this.accessRoleKey = accessRoleKey;
    }

    public String getAccessPermission() {
        return this.accessPermission;
    }

    public void setAccessPermission(String accessPermission) {
        this.accessPermission = accessPermission;
    }

    public String getDeptIds() {
        return this.deptIds;
    }

    public void setDeptIds(String deptIds) {
        this.deptIds = deptIds;
    }

    public String getModelName() {
        return this.modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getModelContent() {
        return this.modelContent;
    }

    public void setModelContent(String modelContent) {
        this.modelContent = modelContent;
    }

    public Long getModelId() {
        return this.modelId;
    }

    public void setModelId(Long modelId) {
        this.modelId = modelId;
    }

    public BigDecimal getPoint() {
        return this.point;
    }

    public void setPoint(BigDecimal point) {
        this.point = point;
    }

    public Long getDeptId() {
        return this.deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public String getDeptName() {
        return this.deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public BigDecimal getPrice() {
        return this.price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getActType() {
        return this.actType;
    }

    public void setActType(Integer actType) {
        this.actType = actType;
    }

    public int getRegisterCount() {
        return this.registerCount;
    }

    public void setRegisterCount(int registerCount) {
        this.registerCount = registerCount;
    }

    public String getTimeZone() {
        return this.timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public int getType() {
        return this.type;
    }

    public void setType(int type) {
        this.type = type;
    }

    public int getSignStatus() {
        return this.signStatus;
    }

    public void setSignStatus(int signStatus) {
        this.signStatus = signStatus;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCreateUserId() {
        return this.createUserId;
    }

    public void setCreateUserId(Long createUserId) {
        this.createUserId = createUserId;
    }

    public String getCreateName() {
        return this.createName;
    }

    public void setCreateName(String createName) {
        this.createName = createName;
    }

    public String getCreateNickName() {
        return this.createNickName;
    }

    public void setCreateNickName(String createNickName) {
        this.createNickName = createNickName;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return this.name;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getIcon() {
        return this.icon;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getStartTime() {
        return this.startTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public Date getEndTime() {
        return this.endTime;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAddress() {
        return this.address;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public String getDetail() {
        return this.detail;
    }

    public void setSignStartTime(Date signStartTime) {
        this.signStartTime = signStartTime;
    }

    public Date getSignStartTime() {
        return this.signStartTime;
    }

    public void setSignEndTime(Date signEndTime) {
        this.signEndTime = signEndTime;
    }

    public Date getSignEndTime() {
        return this.signEndTime;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public Long getStatus() {
        return this.status;
    }

    public void setEnabled(Long enabled) {
        this.enabled = enabled;
    }

    public Long getEnabled() {
        return this.enabled;
    }

    public int getEnrollment() {
        return this.enrollment;
    }

    public void setEnrollment(int enrollment) {
        this.enrollment = enrollment;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("name", (Object)this.getName()).append("icon", (Object)this.getIcon()).append("startTime", (Object)this.getStartTime()).append("endTime", (Object)this.getEndTime()).append("address", (Object)this.getAddress()).append("enrollment", this.getEnrollment()).append("detail", (Object)this.getDetail()).append("signStartTime", (Object)this.getSignStartTime()).append("signEndTime", (Object)this.getSignEndTime()).append("status", (Object)this.getStatus()).append("enabled", (Object)this.getEnabled()).append("createTime", (Object)this.getCreateTime()).append("updateTime", (Object)this.getUpdateTime()).toString();
    }
}

