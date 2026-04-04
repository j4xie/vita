/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.core.page;

import java.io.Serializable;
import java.util.List;

public class TableDataInfo
implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer pageNum;
    private Integer pageSize;
    private long total;
    private long totalPage;
    private List<?> rows;
    private int code;
    private String msg;

    public TableDataInfo() {
    }

    public TableDataInfo(List<?> list, long total) {
        this.rows = list;
        this.total = total;
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

    public long getTotalPage() {
        return this.totalPage;
    }

    public void setTotalPage(long totalPage) {
        this.totalPage = totalPage;
    }

    public long getTotal() {
        return this.total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public List<?> getRows() {
        return this.rows;
    }

    public void setRows(List<?> rows) {
        this.rows = rows;
    }

    public int getCode() {
        return this.code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return this.msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }
}

