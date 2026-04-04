/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysUserPost {
    private Long userId;
    private Long postId;

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPostId() {
        return this.postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("userId", (Object)this.getUserId()).append("postId", (Object)this.getPostId()).toString();
    }
}

