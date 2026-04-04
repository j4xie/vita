/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonFormat
 *  com.ruoyi.common.annotation.Excel
 *  com.ruoyi.common.annotation.Excel$ColumnType
 *  com.ruoyi.common.core.domain.BaseEntity
 */
package com.ruoyi.system.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import java.util.Date;

public class SysOperLog
extends BaseEntity {
    private static final long serialVersionUID = 1L;
    @Excel(name="\u64cd\u4f5c\u5e8f\u53f7", cellType=Excel.ColumnType.NUMERIC)
    private Long operId;
    @Excel(name="\u64cd\u4f5c\u6a21\u5757")
    private String title;
    @Excel(name="\u4e1a\u52a1\u7c7b\u578b", readConverterExp="0=\u5176\u5b83,1=\u65b0\u589e,2=\u4fee\u6539,3=\u5220\u9664,4=\u6388\u6743,5=\u5bfc\u51fa,6=\u5bfc\u5165,7=\u5f3a\u9000,8=\u751f\u6210\u4ee3\u7801,9=\u6e05\u7a7a\u6570\u636e")
    private Integer businessType;
    private Integer[] businessTypes;
    @Excel(name="\u8bf7\u6c42\u65b9\u6cd5")
    private String method;
    @Excel(name="\u8bf7\u6c42\u65b9\u5f0f")
    private String requestMethod;
    @Excel(name="\u64cd\u4f5c\u7c7b\u522b", readConverterExp="0=\u5176\u5b83,1=\u540e\u53f0\u7528\u6237,2=\u624b\u673a\u7aef\u7528\u6237")
    private Integer operatorType;
    @Excel(name="\u64cd\u4f5c\u4eba\u5458")
    private String operName;
    @Excel(name="\u90e8\u95e8\u540d\u79f0")
    private String deptName;
    @Excel(name="\u8bf7\u6c42\u5730\u5740")
    private String operUrl;
    @Excel(name="\u64cd\u4f5c\u5730\u5740")
    private String operIp;
    @Excel(name="\u64cd\u4f5c\u5730\u70b9")
    private String operLocation;
    @Excel(name="\u8bf7\u6c42\u53c2\u6570")
    private String operParam;
    @Excel(name="\u8fd4\u56de\u53c2\u6570")
    private String jsonResult;
    @Excel(name="\u72b6\u6001", readConverterExp="0=\u6b63\u5e38,1=\u5f02\u5e38")
    private Integer status;
    @Excel(name="\u9519\u8bef\u6d88\u606f")
    private String errorMsg;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    @Excel(name="\u64cd\u4f5c\u65f6\u95f4", width=30.0, dateFormat="yyyy-MM-dd HH:mm:ss")
    private Date operTime;
    @Excel(name="\u6d88\u8017\u65f6\u95f4", suffix="\u6beb\u79d2")
    private Long costTime;

    public Long getOperId() {
        return this.operId;
    }

    public void setOperId(Long operId) {
        this.operId = operId;
    }

    public String getTitle() {
        return this.title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getBusinessType() {
        return this.businessType;
    }

    public void setBusinessType(Integer businessType) {
        this.businessType = businessType;
    }

    public Integer[] getBusinessTypes() {
        return this.businessTypes;
    }

    public void setBusinessTypes(Integer[] businessTypes) {
        this.businessTypes = businessTypes;
    }

    public String getMethod() {
        return this.method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getRequestMethod() {
        return this.requestMethod;
    }

    public void setRequestMethod(String requestMethod) {
        this.requestMethod = requestMethod;
    }

    public Integer getOperatorType() {
        return this.operatorType;
    }

    public void setOperatorType(Integer operatorType) {
        this.operatorType = operatorType;
    }

    public String getOperName() {
        return this.operName;
    }

    public void setOperName(String operName) {
        this.operName = operName;
    }

    public String getDeptName() {
        return this.deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public String getOperUrl() {
        return this.operUrl;
    }

    public void setOperUrl(String operUrl) {
        this.operUrl = operUrl;
    }

    public String getOperIp() {
        return this.operIp;
    }

    public void setOperIp(String operIp) {
        this.operIp = operIp;
    }

    public String getOperLocation() {
        return this.operLocation;
    }

    public void setOperLocation(String operLocation) {
        this.operLocation = operLocation;
    }

    public String getOperParam() {
        return this.operParam;
    }

    public void setOperParam(String operParam) {
        this.operParam = operParam;
    }

    public String getJsonResult() {
        return this.jsonResult;
    }

    public void setJsonResult(String jsonResult) {
        this.jsonResult = jsonResult;
    }

    public Integer getStatus() {
        return this.status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getErrorMsg() {
        return this.errorMsg;
    }

    public void setErrorMsg(String errorMsg) {
        this.errorMsg = errorMsg;
    }

    public Date getOperTime() {
        return this.operTime;
    }

    public void setOperTime(Date operTime) {
        this.operTime = operTime;
    }

    public Long getCostTime() {
        return this.costTime;
    }

    public void setCostTime(Long costTime) {
        this.costTime = costTime;
    }
}

