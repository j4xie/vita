/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonInclude
 *  com.fasterxml.jackson.annotation.JsonInclude$Include
 */
package com.ruoyi.system.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ruoyi.system.domain.vo.MetaVo;
import java.util.List;

@JsonInclude(value=JsonInclude.Include.NON_EMPTY)
public class RouterVo {
    private String name;
    private String path;
    private boolean hidden;
    private String redirect;
    private String component;
    private String query;
    private Boolean alwaysShow;
    private MetaVo meta;
    private List<RouterVo> children;

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return this.path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public boolean getHidden() {
        return this.hidden;
    }

    public void setHidden(boolean hidden) {
        this.hidden = hidden;
    }

    public String getRedirect() {
        return this.redirect;
    }

    public void setRedirect(String redirect) {
        this.redirect = redirect;
    }

    public String getComponent() {
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

    public Boolean getAlwaysShow() {
        return this.alwaysShow;
    }

    public void setAlwaysShow(Boolean alwaysShow) {
        this.alwaysShow = alwaysShow;
    }

    public MetaVo getMeta() {
        return this.meta;
    }

    public void setMeta(MetaVo meta) {
        this.meta = meta;
    }

    public List<RouterVo> getChildren() {
        return this.children;
    }

    public void setChildren(List<RouterVo> children) {
        this.children = children;
    }
}

