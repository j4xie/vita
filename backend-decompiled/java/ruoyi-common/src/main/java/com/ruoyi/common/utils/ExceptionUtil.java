/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.commons.lang3.exception.ExceptionUtils
 */
package com.ruoyi.common.utils;

import com.ruoyi.common.utils.StringUtils;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import org.apache.commons.lang3.exception.ExceptionUtils;

public class ExceptionUtil {
    public static String getExceptionMessage(Throwable e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter((Writer)sw, true));
        return sw.toString();
    }

    public static String getRootErrorMessage(Exception e) {
        Throwable root = ExceptionUtils.getRootCause((Throwable)e);
        Throwable throwable = root = root == null ? e : root;
        if (root == null) {
            return "";
        }
        String msg = root.getMessage();
        if (msg == null) {
            return "null";
        }
        return StringUtils.defaultString((String)msg);
    }
}

