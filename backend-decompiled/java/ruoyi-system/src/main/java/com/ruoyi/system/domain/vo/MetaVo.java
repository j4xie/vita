/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.StringUtils
 */
package com.ruoyi.system.domain.vo;

import com.ruoyi.common.utils.StringUtils;

public class MetaVo {
    private String title;
    private String icon;
    private boolean noCache;
    private String link;

    public MetaVo() {
    }

    public MetaVo(String title, String icon) {
        this.title = title;
        this.icon = icon;
    }

    public MetaVo(String title, String icon, boolean noCache) {
        this.title = title;
        this.icon = icon;
        this.noCache = noCache;
    }

    public MetaVo(String title, String icon, String link) {
        this.title = title;
        this.icon = icon;
        this.link = link;
    }

    public MetaVo(String title, String icon, boolean noCache, String link) {
        this.title = title;
        this.icon = icon;
        this.noCache = noCache;
        if (StringUtils.ishttp((String)link)) {
            this.link = link;
        }
    }

    public boolean isNoCache() {
        return this.noCache;
    }

    public void setNoCache(boolean noCache) {
        this.noCache = noCache;
    }

    public String getTitle() {
        return this.title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIcon() {
        return this.icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getLink() {
        return this.link;
    }

    public void setLink(String link) {
        this.link = link;
    }
}

