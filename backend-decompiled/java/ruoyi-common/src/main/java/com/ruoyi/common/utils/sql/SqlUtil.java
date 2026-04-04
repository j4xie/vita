/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.utils.sql;

import com.ruoyi.common.exception.UtilException;
import com.ruoyi.common.utils.StringUtils;

public class SqlUtil {
    public static String SQL_REGEX = "\u000b|and |extractvalue|updatexml|sleep|exec |insert |select |delete |update |drop |count |chr |mid |master |truncate |char |declare |or |union |like |+|/*|user()";
    public static String SQL_PATTERN = "[a-zA-Z0-9_\\ \\,\\.]+";
    private static final int ORDER_BY_MAX_LENGTH = 500;

    public static String escapeOrderBySql(String value) {
        if (StringUtils.isNotEmpty(value) && !SqlUtil.isValidOrderBySql(value)) {
            throw new UtilException("\u53c2\u6570\u4e0d\u7b26\u5408\u89c4\u8303\uff0c\u4e0d\u80fd\u8fdb\u884c\u67e5\u8be2");
        }
        if (StringUtils.length((CharSequence)value) > 500) {
            throw new UtilException("\u53c2\u6570\u5df2\u8d85\u8fc7\u6700\u5927\u9650\u5236\uff0c\u4e0d\u80fd\u8fdb\u884c\u67e5\u8be2");
        }
        return value;
    }

    public static boolean isValidOrderBySql(String value) {
        return value.matches(SQL_PATTERN);
    }

    public static void filterKeyword(String value) {
        String[] sqlKeywords;
        if (StringUtils.isEmpty(value)) {
            return;
        }
        for (String sqlKeyword : sqlKeywords = StringUtils.split((String)SQL_REGEX, (String)"\\|")) {
            if (StringUtils.indexOfIgnoreCase((CharSequence)value, (CharSequence)sqlKeyword) <= -1) continue;
            throw new UtilException("\u53c2\u6570\u5b58\u5728SQL\u6ce8\u5165\u98ce\u9669");
        }
    }
}

