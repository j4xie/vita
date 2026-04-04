/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.NotNull
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.common.core.domain.entity;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import java.util.Set;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysRole
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u89d2\u8272\u5e8f\u53f7", cellType=Excel.ColumnType.NUMERIC)
    private Long roleId;
    @Excel(name="\u89d2\u8272\u540d\u79f0")
    private String roleName;
    @Excel(name="\u89d2\u8272\u6743\u9650")
    private String roleKey;
    @Excel(name="\u89d2\u8272\u6392\u5e8f")
    private Integer roleSort;
    @Excel(name="\u6570\u636e\u8303\u56f4", readConverterExp="1=\u6240\u6709\u6570\u636e\u6743\u9650,2=\u81ea\u5b9a\u4e49\u6570\u636e\u6743\u9650,3=\u672c\u90e8\u95e8\u6570\u636e\u6743\u9650,4=\u672c\u90e8\u95e8\u53ca\u4ee5\u4e0b\u6570\u636e\u6743\u9650,5=\u4ec5\u672c\u4eba\u6570\u636e\u6743\u9650")
    private String dataScope;
    private boolean menuCheckStrictly;
    private boolean deptCheckStrictly;
    @Excel(name="\u89d2\u8272\u72b6\u6001", readConverterExp="0=\u6b63\u5e38,1=\u505c\u7528")
    private String status;
    private String delFlag;
    private boolean flag = false;
    private Long[] menuIds;
    private Long[] deptIds;
    private Set<String> permissions;
    private int isSelected;

    public int getIsSelected() {
        return this.isSelected;
    }

    public void setIsSelected(int isSelected) {
        this.isSelected = isSelected;
    }

    public SysRole() {
    }

    public SysRole(Long roleId) {
        this.roleId = roleId;
    }

    public Long getRoleId() {
        return this.roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public boolean isAdmin() {
        return SysRole.isAdmin(this.roleId);
    }

    public static boolean isAdmin(Long roleId) {
        return roleId != null && 1L == roleId;
    }

    @NotBlank(message="\u89d2\u8272\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=30, message="\u89d2\u8272\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc730\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u89d2\u8272\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=30, message="\u89d2\u8272\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc730\u4e2a\u5b57\u7b26") String getRoleName() {
        return this.roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    @NotBlank(message="\u6743\u9650\u5b57\u7b26\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=100, message="\u6743\u9650\u5b57\u7b26\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u6743\u9650\u5b57\u7b26\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=100, message="\u6743\u9650\u5b57\u7b26\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getRoleKey() {
        return this.roleKey;
    }

    public void setRoleKey(String roleKey) {
        this.roleKey = roleKey;
    }

    @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a")
    public @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a") Integer getRoleSort() {
        return this.roleSort;
    }

    public void setRoleSort(Integer roleSort) {
        this.roleSort = roleSort;
    }

    public String getDataScope() {
        return this.dataScope;
    }

    public void setDataScope(String dataScope) {
        this.dataScope = dataScope;
    }

    public boolean isMenuCheckStrictly() {
        return this.menuCheckStrictly;
    }

    public void setMenuCheckStrictly(boolean menuCheckStrictly) {
        this.menuCheckStrictly = menuCheckStrictly;
    }

    public boolean isDeptCheckStrictly() {
        return this.deptCheckStrictly;
    }

    public void setDeptCheckStrictly(boolean deptCheckStrictly) {
        this.deptCheckStrictly = deptCheckStrictly;
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

    public boolean isFlag() {
        return this.flag;
    }

    public void setFlag(boolean flag) {
        this.flag = flag;
    }

    public Long[] getMenuIds() {
        return this.menuIds;
    }

    public void setMenuIds(Long[] menuIds) {
        this.menuIds = menuIds;
    }

    public Long[] getDeptIds() {
        return this.deptIds;
    }

    public void setDeptIds(Long[] deptIds) {
        this.deptIds = deptIds;
    }

    public Set<String> getPermissions() {
        return this.permissions;
    }

    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("roleId", (Object)this.getRoleId()).append("roleName", (Object)this.getRoleName()).append("roleKey", (Object)this.getRoleKey()).append("roleSort", (Object)this.getRoleSort()).append("dataScope", (Object)this.getDataScope()).append("menuCheckStrictly", this.isMenuCheckStrictly()).append("deptCheckStrictly", this.isDeptCheckStrictly()).append("status", (Object)this.getStatus()).append("delFlag", (Object)this.getDelFlag()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).append("isSelected", this.getIsSelected()).toString();
    }
}

