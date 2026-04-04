/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.servlet.ReadListener
 *  javax.servlet.ServletInputStream
 *  javax.servlet.ServletRequest
 *  javax.servlet.ServletResponse
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletRequestWrapper
 */
package com.ruoyi.common.filter;

import com.ruoyi.common.utils.http.HttpHelper;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

public class RepeatedlyRequestWrapper
extends HttpServletRequestWrapper {
    private final byte[] body;

    public RepeatedlyRequestWrapper(HttpServletRequest request, ServletResponse response) throws IOException {
        super(request);
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        this.body = HttpHelper.getBodyString((ServletRequest)request).getBytes("UTF-8");
    }

    public BufferedReader getReader() throws IOException {
        return new BufferedReader(new InputStreamReader((InputStream)this.getInputStream()));
    }

    public ServletInputStream getInputStream() throws IOException {
        final ByteArrayInputStream bais = new ByteArrayInputStream(this.body);
        return new ServletInputStream(){

            public int read() throws IOException {
                return bais.read();
            }

            public int available() throws IOException {
                return RepeatedlyRequestWrapper.this.body.length;
            }

            public boolean isFinished() {
                return false;
            }

            public boolean isReady() {
                return false;
            }

            public void setReadListener(ReadListener readListener) {
            }
        };
    }
}

