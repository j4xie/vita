/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alibaba.fastjson2.filter.SimplePropertyPreFilter
 */
package com.ruoyi.common.filter;

import com.alibaba.fastjson2.filter.SimplePropertyPreFilter;

public class PropertyPreExcludeFilter
extends SimplePropertyPreFilter {
    public PropertyPreExcludeFilter() {
        super(new String[0]);
    }

    public PropertyPreExcludeFilter addExcludes(String ... filters) {
        for (int i = 0; i < filters.length; ++i) {
            this.getExcludes().add(filters[i]);
        }
        return this;
    }
}

