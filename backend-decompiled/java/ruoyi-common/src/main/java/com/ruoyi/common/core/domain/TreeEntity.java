/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.core.domain;

import com.ruoyi.common.core.domain.BaseEntity;
import java.util.ArrayList;
import java.util.List;

public class TreeEntity
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private String parentName;
    private Long parentId;
    private Integer orderNum;
    private String ancestors;
    private List<?> children = new ArrayList();

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

    public Integer getOrderNum() {
        return this.orderNum;
    }

    public void setOrderNum(Integer orderNum) {
        this.orderNum = orderNum;
    }

    public String getAncestors() {
        return this.ancestors;
    }

    public void setAncestors(String ancestors) {
        this.ancestors = ancestors;
    }

    public List<?> getChildren() {
        return this.children;
    }

    public void setChildren(List<?> children) {
        this.children = children;
    }
}

