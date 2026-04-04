/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.servlet.ServletRequest
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletResponse
 *  javax.servlet.http.HttpSession
 *  org.springframework.web.context.request.RequestAttributes
 *  org.springframework.web.context.request.RequestContextHolder
 *  org.springframework.web.context.request.ServletRequestAttributes
 */
package com.ruoyi.common.utils;

import com.ruoyi.common.core.text.Convert;
import com.ruoyi.common.utils.StringUtils;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class ServletUtils {
    public static String getParameter(String name) {
        return ServletUtils.getRequest().getParameter(name);
    }

    public static String getParameter(String name, String defaultValue) {
        return Convert.toStr(ServletUtils.getRequest().getParameter(name), defaultValue);
    }

    public static Integer getParameterToInt(String name) {
        return Convert.toInt(ServletUtils.getRequest().getParameter(name));
    }

    public static Integer getParameterToInt(String name, Integer defaultValue) {
        return Convert.toInt(ServletUtils.getRequest().getParameter(name), defaultValue);
    }

    public static Boolean getParameterToBool(String name) {
        return Convert.toBool(ServletUtils.getRequest().getParameter(name));
    }

    public static Boolean getParameterToBool(String name, Boolean defaultValue) {
        return Convert.toBool(ServletUtils.getRequest().getParameter(name), defaultValue);
    }

    public static Map<String, String[]> getParams(ServletRequest request) {
        Map map = request.getParameterMap();
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, String> getParamMap(ServletRequest request) {
        HashMap<String, String> params = new HashMap<String, String>();
        for (Map.Entry<String, String[]> entry : ServletUtils.getParams(request).entrySet()) {
            params.put(entry.getKey(), StringUtils.join((Object[])entry.getValue(), (String)","));
        }
        return params;
    }

    public static HttpServletRequest getRequest() {
        return ServletUtils.getRequestAttributes().getRequest();
    }

    public static HttpServletResponse getResponse() {
        return ServletUtils.getRequestAttributes().getResponse();
    }

    public static HttpSession getSession() {
        return ServletUtils.getRequest().getSession();
    }

    public static ServletRequestAttributes getRequestAttributes() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        return (ServletRequestAttributes)attributes;
    }

    public static void renderString(HttpServletResponse response, String string) {
        try {
            response.setStatus(200);
            response.setContentType("application/json");
            response.setCharacterEncoding("utf-8");
            response.getWriter().print(string);
        }
        catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static boolean isAjaxRequest(HttpServletRequest request) {
        String accept = request.getHeader("accept");
        if (accept != null && accept.contains("application/json")) {
            return true;
        }
        String xRequestedWith = request.getHeader("X-Requested-With");
        if (xRequestedWith != null && xRequestedWith.contains("XMLHttpRequest")) {
            return true;
        }
        String uri = request.getRequestURI();
        if (StringUtils.inStringIgnoreCase(uri, ".json", ".xml")) {
            return true;
        }
        String ajax = request.getParameter("__ajax");
        return StringUtils.inStringIgnoreCase(ajax, "json", "xml");
    }

    public static String urlEncode(String str) {
        try {
            return URLEncoder.encode(str, "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            return "";
        }
    }

    public static String urlDecode(String str) {
        try {
            return URLDecoder.decode(str, "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            return "";
        }
    }
}

