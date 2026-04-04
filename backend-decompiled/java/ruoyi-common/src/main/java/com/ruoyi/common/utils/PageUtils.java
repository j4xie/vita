/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.github.pagehelper.PageHelper
 */
package com.ruoyi.common.utils;

import com.github.pagehelper.PageHelper;
import com.ruoyi.common.core.page.PageDomain;
import com.ruoyi.common.core.page.TableSupport;
import com.ruoyi.common.utils.sql.SqlUtil;

public class PageUtils
extends PageHelper {
    public static void startPage() {
        PageDomain pageDomain = TableSupport.buildPageRequest();
        Integer pageNum = pageDomain.getPageNum();
        Integer pageSize = pageDomain.getPageSize();
        String orderBy = SqlUtil.escapeOrderBySql(pageDomain.getOrderBy());
        Boolean reasonable = pageDomain.getReasonable();
        PageHelper.startPage((int)pageNum, (int)pageSize, (String)orderBy).setReasonable(reasonable);
    }

    public static void clearPage() {
        PageHelper.clearPage();
    }
}

