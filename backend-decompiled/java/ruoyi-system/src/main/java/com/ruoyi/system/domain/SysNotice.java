/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.BaseEntity
 *  com.ruoyi.common.xss.Xss
 *  javax.validation.constraints.NotBlank
 *  javax.validation.constraints.Size
 *  org.apache.commons.lang3.builder.ToStringBuilder
 *  org.apache.commons.lang3.builder.ToStringStyle
 */
package com.ruoyi.system.domain;

import com.ruoyi.common.core.domain.BaseEntity;
import com.ruoyi.common.xss.Xss;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

public class SysNotice
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    private Long noticeId;
    private String noticeTitle;
    private String noticeType;
    private String noticeContent;
    private String status;

    public Long getNoticeId() {
        return this.noticeId;
    }

    public void setNoticeId(Long noticeId) {
        this.noticeId = noticeId;
    }

    public void setNoticeTitle(String noticeTitle) {
        this.noticeTitle = noticeTitle;
    }

    @Xss(message="\u516c\u544a\u6807\u9898\u4e0d\u80fd\u5305\u542b\u811a\u672c\u5b57\u7b26")
    @NotBlank(message="\u516c\u544a\u6807\u9898\u4e0d\u80fd\u4e3a\u7a7a")
    @Size(min=0, max=50, message="\u516c\u544a\u6807\u9898\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26")
    public @NotBlank(message="\u516c\u544a\u6807\u9898\u4e0d\u80fd\u4e3a\u7a7a") @Size(min=0, max=50, message="\u516c\u544a\u6807\u9898\u4e0d\u80fd\u8d85\u8fc750\u4e2a\u5b57\u7b26") String getNoticeTitle() {
        return this.noticeTitle;
    }

    public void setNoticeType(String noticeType) {
        this.noticeType = noticeType;
    }

    public String getNoticeType() {
        return this.noticeType;
    }

    public void setNoticeContent(String noticeContent) {
        this.noticeContent = noticeContent;
    }

    public String getNoticeContent() {
        return this.noticeContent;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatus() {
        return this.status;
    }

    public String toString() {
        return new ToStringBuilder((Object)this, ToStringStyle.MULTI_LINE_STYLE).append("noticeId", (Object)this.getNoticeId()).append("noticeTitle", (Object)this.getNoticeTitle()).append("noticeType", (Object)this.getNoticeType()).append("noticeContent", (Object)this.getNoticeContent()).append("status", (Object)this.getStatus()).append("createBy", (Object)this.getCreateBy()).append("createTime", (Object)this.getCreateTime()).append("updateBy", (Object)this.getUpdateBy()).append("updateTime", (Object)this.getUpdateTime()).append("remark", (Object)this.getRemark()).toString();
    }
}

