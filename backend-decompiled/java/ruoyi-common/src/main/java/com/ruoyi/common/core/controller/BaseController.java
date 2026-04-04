/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.github.pagehelper.PageHelper
 *  com.github.pagehelper.PageInfo
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.springframework.web.bind.WebDataBinder
 *  org.springframework.web.bind.annotation.InitBinder
 */
package com.ruoyi.common.core.controller;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.core.page.PageDomain;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.core.page.TableSupport;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.PageUtils;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.sql.SqlUtil;
import java.beans.PropertyEditor;
import java.beans.PropertyEditorSupport;
import java.util.Date;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;

public class BaseController {
    protected final Logger logger = LoggerFactory.getLogger(this.getClass());

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.registerCustomEditor(Date.class, (PropertyEditor)new PropertyEditorSupport(){

            @Override
            public void setAsText(String text) {
                this.setValue(DateUtils.parseDate(text));
            }
        });
    }

    protected void startPage() {
        PageUtils.startPage();
    }

    protected void startOrderBy() {
        PageDomain pageDomain = TableSupport.buildPageRequest();
        if (StringUtils.isNotEmpty(pageDomain.getOrderBy())) {
            String orderBy = SqlUtil.escapeOrderBySql(pageDomain.getOrderBy());
            PageHelper.orderBy((String)orderBy);
        }
    }

    protected void clearPage() {
        PageUtils.clearPage();
    }

    protected TableDataInfo getDataTable(List<?> list) {
        TableDataInfo rspData = new TableDataInfo();
        rspData.setCode(200);
        rspData.setMsg("\u67e5\u8be2\u6210\u529f");
        rspData.setRows(list);
        rspData.setTotal(new PageInfo(list).getTotal());
        PageDomain pageDomain = TableSupport.buildPageRequest();
        rspData.setPageNum(pageDomain.getPageNum());
        rspData.setPageSize(pageDomain.getPageSize());
        rspData.setTotalPage(rspData.getTotal() % (long)pageDomain.getPageSize().intValue() > 0L ? rspData.getTotal() / (long)pageDomain.getPageSize().intValue() + 1L : rspData.getTotal() / (long)pageDomain.getPageSize().intValue());
        return rspData;
    }

    public AjaxResult success() {
        return AjaxResult.success();
    }

    public AjaxResult error() {
        return AjaxResult.error();
    }

    public AjaxResult success(String message) {
        return AjaxResult.success(message);
    }

    public AjaxResult success(Object data) {
        return AjaxResult.success(data);
    }

    public AjaxResult error(String message) {
        return AjaxResult.error(message);
    }

    public AjaxResult warn(String message) {
        return AjaxResult.warn(message);
    }

    protected AjaxResult toAjax(int rows) {
        return rows > 0 ? AjaxResult.success() : AjaxResult.error();
    }

    protected AjaxResult toAjax(boolean result) {
        return result ? this.success() : this.error();
    }

    public String redirect(String url) {
        return StringUtils.format("redirect:{}", url);
    }

    public LoginUser getLoginUser() {
        return SecurityUtils.getLoginUser();
    }

    public Long getUserId() {
        return this.getLoginUser().getUserId();
    }

    public Long getDeptId() {
        return this.getLoginUser().getDeptId();
    }

    public String getUsername() {
        return this.getLoginUser().getUsername();
    }
}

