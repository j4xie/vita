/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.core.domain.BaseEntity
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class AiNormalQuestion
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long id;
    @Excel(name="\u95ee\u9898\u5185\u5bb9")
    private String message;
    @Excel(name="\u521b\u5efa\u4ebauser_id")
    private Long createById;
    private String createByName;

    public String getCreateByName() {
        return this.createByName;
    }

    public void setCreateByName(String createByName) {
        this.createByName = createByName;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return this.id;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return this.message;
    }

    public void setCreateById(Long createById) {
        this.createById = createById;
    }

    public Long getCreateById() {
        return this.createById;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("id", (Object)this.getId()).append("message", (Object)this.getMessage()).append("createById", (Object)this.getCreateById()).append("createTime", (Object)this.getCreateTime()).toString();
    }
}

