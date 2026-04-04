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
 */
package com.ruoyi.common.filter;

import com.ruoyi.common.filter.RepeatedlyRequestWrapper;
import com.ruoyi.common.utils.StringUtils;
import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

public class RepeatableFilter
implements Filter {
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        RepeatedlyRequestWrapper requestWrapper = null;
        if (request instanceof HttpServletRequest && StringUtils.startsWithIgnoreCase((CharSequence)request.getContentType(), (CharSequence)"application/json")) {
            requestWrapper = new RepeatedlyRequestWrapper((HttpServletRequest)request, response);
        }
        if (null == requestWrapper) {
            chain.doFilter(request, response);
        } else {
            chain.doFilter(requestWrapper, response);
        }
    }

    public void destroy() {
    }
}

