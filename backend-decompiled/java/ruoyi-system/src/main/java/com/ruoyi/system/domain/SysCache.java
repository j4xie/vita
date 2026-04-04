/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.utils.StringUtils
 */
package com.ruoyi.system.domain;

import com.ruoyi.common.utils.StringUtils;

public class SysCache {
    private String cacheName = "";
    private String cacheKey = "";
    private String cacheValue = "";
    private String remark = "";

    public SysCache() {
    }

    public SysCache(String cacheName, String remark) {
        this.cacheName = cacheName;
        this.remark = remark;
    }

    public SysCache(String cacheName, String cacheKey, String cacheValue) {
        this.cacheName = StringUtils.replace((String)cacheName, (String)":", (String)"");
        this.cacheKey = StringUtils.replace((String)cacheKey, (String)cacheName, (String)"");
        this.cacheValue = cacheValue;
    }

    public String getCacheName() {
        return this.cacheName;
    }

    public void setCacheName(String cacheName) {
        this.cacheName = cacheName;
    }

    public String getCacheKey() {
        return this.cacheKey;
    }

    public void setCacheKey(String cacheKey) {
        this.cacheKey = cacheKey;
    }

    public String getCacheValue() {
        return this.cacheValue;
    }

    public void setCacheValue(String cacheValue) {
        this.cacheValue = cacheValue;
    }

    public String getRemark() {
        return this.remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}

