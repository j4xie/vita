/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.servlet.Filter
 *  javax.servlet.FilterChain
 *  javax.servlet.FilterConfig
 *  javax.servlet.ServletException
 *  javax.servlet.ServletRequest
 *  javax.servlet.ServletResponse
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletResponse
 */
package com.ruoyi.common.filter;

import com.ruoyi.common.enums.HttpMethod;
import com.ruoyi.common.filter.XssHttpServletRequestWrapper;
import com.ruoyi.common.utils.StringUtils;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class XssFilter
implements Filter {
    public List<String> excludes = new ArrayList<String>();

    public void init(FilterConfig filterConfig) throws ServletException {
        String tempExcludes = filterConfig.getInitParameter("excludes");
        if (StringUtils.isNotEmpty(tempExcludes)) {
            String[] urls;
            for (String url : urls = tempExcludes.split(",")) {
                this.excludes.add(url);
            }
        }
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest)request;
        HttpServletResponse resp = (HttpServletResponse)response;
        if (this.handleExcludeURL(req, resp)) {
            chain.doFilter(request, response);
            return;
        }
        XssHttpServletRequestWrapper xssRequest = new XssHttpServletRequestWrapper((HttpServletRequest)request);
        chain.doFilter((ServletRequest)xssRequest, response);
    }

    private boolean handleExcludeURL(HttpServletRequest request, HttpServletResponse response) {
        String url = request.getServletPath();
        String method = request.getMethod();
        if (method == null || HttpMethod.GET.matches(method) || HttpMethod.DELETE.matches(method)) {
            return true;
        }
        return StringUtils.matches(url, this.excludes);
    }

    public void destroy() {
    }
}

