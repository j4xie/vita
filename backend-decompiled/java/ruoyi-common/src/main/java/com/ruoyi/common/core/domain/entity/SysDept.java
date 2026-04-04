/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.constraints.Email
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.NotNull
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.core.domain.BaseEntity;
import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysDept
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long deptId;
    private Long parentId;
    private String ancestors;
    private String deptName;
    private Integer orderNum;
    private String leader;
    private String phone;
    private String email;
    private String status;
    private String delFlag;
    private String parentName;
    private String logo;
    private String engName;
    private String aprName;
    private String mailDomain;
    private String detail;
    private SysDept childrenDept;
    private List<SysDept> children = new ArrayList<SysDept>();

    public String getDetail() {
        return this.detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public SysDept getChildrenDept() {
        return this.childrenDept;
    }

    public void setChildrenDept(SysDept childrenDept) {
        this.childrenDept = childrenDept;
    }

    public String getMailDomain() {
        return this.mailDomain;
    }

    public void setMailDomain(String mailDomain) {
        this.mailDomain = mailDomain;
    }

    public String getLogo() {
        return this.logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public String getEngName() {
        return this.engName;
    }

    public void setEngName(String engName) {
        this.engName = engName;
    }

    public String getAprName() {
        return this.aprName;
    }

    public void setAprName(String aprName) {
        this.aprName = aprName;
    }

    public Long getDeptId() {
        return this.deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public Long getParentId() {
        return this.parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getAncestors() {
        return this.ancestors;
    }

    public void setAncestors(String ancestors) {
        this.ancestors = ancestors;
    }

    @NotBlank(message="\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getDeptName() {
        return this.deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a")
    public @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a") Integer getOrderNum() {
        return this.orderNum;
    }

    public void setOrderNum(Integer orderNum) {
        this.orderNum = orderNum;
    }

    public String getLeader() {
        return this.leader;
    }

    public void setLeader(String leader) {
        this.leader = leader;
    }

    @Size(min=0, max=11, message="\u8054\u7cfb\u7535\u8bdd\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc711\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=11, message="\u8054\u7cfb\u7535\u8bdd\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc711\u4e2a\u5b57\u7b26") String getPhone() {
        return this.phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    @Email(message="\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e")
    @Size(min=0, max=50, message="\u90ae\u7bb1\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26")
    public @Email(message="\u90ae\u7bb1\u683c\u5f0f\u4e0d\u6b63\u786e") @Size(min=0, max=50, message="\u90ae\u7bb1\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26") String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDelFlag() {
        return this.delFlag;
    }

    public void setDelFlag(String delFlag) {
        this.delFlag = delFlag;
    }

    public String getParentName() {
        return this.parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public List<SysDept> getChildren() {
        return this.children;
    }

    public void setChildren(List<SysDept> children) {
        this.children = children;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("deptId", (Object)this.getDeptId()).append("parentId", (Object)this.getParentId()).append("ancestors", (Object)this.getAncestors()).append("deptName", (Object)this.getDeptName()).append("orderNum", (Object)this.getOrderNum()).append("leader", (Object)this.getLeader()).append("phone", (Object)this.getPhone()).append("email", (Object)this.getEmail()).append("status", (Object)this.getStatus()).append("delFlag", (Object)this.getDelFlag()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).toString();
    }
}

