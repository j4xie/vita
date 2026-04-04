/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.core.page;

import com.ruoyi.common.utils.StringUtils;

public class PageDomain {
    private Integer pageNum;
    private Integer pageSize;
    private String orderByColumn;
    private String isAsc = "asc";
    private Boolean reasonable = true;

    public String getOrderBy() {
        if (StringUtils.isEmpty(this.orderByColumn)) {
            return "";
        }
        return StringUtils.toUnderScoreCase(this.orderByColumn) + " " + this.isAsc;
    }

    public Integer getPageNum() {
        return this.pageNum;
    }

    public void setPageNum(Integer pageNum) {
        this.pageNum = pageNum;
    }

    public Integer getPageSize() {
        return this.pageSize;
    }

    public void setPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }

    public String getOrderByColumn() {
        return this.orderByColumn;
    }

    public void setOrderByColumn(String orderByColumn) {
        this.orderByColumn = orderByColumn;
    }

    public String getIsAsc() {
        return this.isAsc;
    }

    public void setIsAsc(String isAsc) {
        if (StringUtils.isNotEmpty(isAsc)) {
            if ("ascending".equals(isAsc)) {
                isAsc = "asc";
            } else if ("descending".equals(isAsc)) {
                isAsc = "desc";
            }
            this.isAsc = isAsc;
        }
    }

    public Boolean getReasonable() {
        if (StringUtils.isNull(this.reasonable)) {
            return Boolean.TRUE;
        }
        return this.reasonable;
    }

    public void setReasonable(Boolean reasonable) {
        this.reasonable = reasonable;
    }
}

