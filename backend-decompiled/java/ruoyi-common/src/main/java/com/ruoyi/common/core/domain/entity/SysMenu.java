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

import com.ruoyi.common.core.domain.BaseEntity;
import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysMenu
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long menuId;
    private String menuName;
    private String parentName;
    private Long parentId;
    private Integer orderNum;
    private String path;
    private String component;
    private String query;
    private String routeName;
    private String isFrame;
    private String isCache;
    private String menuType;
    private String visible;
    private String status;
    private String perms;
    private String icon;
    private List<SysMenu> children = new ArrayList<SysMenu>();

    public Long getMenuId() {
        return this.menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    @NotBlank(message="\u83dc\u5355\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=50, message="\u83dc\u5355\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u83dc\u5355\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=50, message="\u83dc\u5355\u540d\u79f0\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26") String getMenuName() {
        return this.menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }

    public String getParentName() {
        return this.parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public Long getParentId() {
        return this.parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a")
    public @NotNull(message="\u663e\u793a\u987a\u5e8f\u4e0d\u80fd\u4e3a\u7a7a") Integer getOrderNum() {
        return this.orderNum;
    }

    public void setOrderNum(Integer orderNum) {
        this.orderNum = orderNum;
    }

    @Size(min=0, max=200, message="\u8def\u7531\u5730\u5740\u4e0d\u80fd\u8d85\u8fc7200\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=200, message="\u8def\u7531\u5730\u5740\u4e0d\u80fd\u8d85\u8fc7200\u4e2a\u5b57\u7b26") String getPath() {
        return this.path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    @Size(min=0, max=200, message="\u7ec4\u4ef6\u8def\u5f84\u4e0d\u80fd\u8d85\u8fc7255\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=200, message="\u7ec4\u4ef6\u8def\u5f84\u4e0d\u80fd\u8d85\u8fc7255\u4e2a\u5b57\u7b26") String getComponent() {
        return this.component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public String getQuery() {
        return this.query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getRouteName() {
        return this.routeName;
    }

    public void setRouteName(String routeName) {
        this.routeName = routeName;
    }

    public String getIsFrame() {
        return this.isFrame;
    }

    public void setIsFrame(String isFrame) {
        this.isFrame = isFrame;
    }

    public String getIsCache() {
        return this.isCache;
    }

    public void setIsCache(String isCache) {
        this.isCache = isCache;
    }

    @NotBlank(message="\u83dc\u5355\u7c7b\u578b\u4e0d\u80fd\u4e3a\u7a7a")
    public @NotBlank(message="\u83dc\u5355\u7c7b\u578b\u4e0d\u80fd\u4e3a\u7a7a") String getMenuType() {
        return this.menuType;
    }

    public void setMenuType(String menuType) {
        this.menuType = menuType;
    }

    public String getVisible() {
        return this.visible;
    }

    public void setVisible(String visible) {
        this.visible = visible;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Size(min=0, max=100, message="\u6743\u9650\u6807\u8bc6\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26")
    public @Size(min=0, max=100, message="\u6743\u9650\u6807\u8bc6\u957f\u5ea6\u4e0d\u80fd\u8d85\u8fc7100\u4e2a\u5b57\u7b26") String getPerms() {
        return this.perms;
    }

    public void setPerms(String perms) {
        this.perms = perms;
    }

    public String getIcon() {
        return this.icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public List<SysMenu> getChildren() {
        return this.children;
    }

    public void setChildren(List<SysMenu> children) {
        this.children = children;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("menuId", (Object)this.getMenuId()).append("menuName", (Object)this.getMenuName()).append("parentId", (Object)this.getParentId()).append("orderNum", (Object)this.getOrderNum()).append("path", (Object)this.getPath()).append("component", (Object)this.getComponent()).append("query", (Object)this.getQuery()).append("routeName", (Object)this.getRouteName()).append("isFrame", (Object)this.getIsFrame()).append("IsCache", (Object)this.getIsCache()).append("menuType", (Object)this.getMenuType()).append("visible", (Object)this.getVisible()).append("status ", (Object)this.getStatus()).append("perms", (Object)this.getPerms()).append("icon", (Object)this.getIcon()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).toString();
    }
}

