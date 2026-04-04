/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.servlet.ServletInputStream
 *  javax.servlet.ServletRequest
 *  org.apache.commons.lang3.exception.ExceptionUtils
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils.http;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import javax.servlet.ServletInputStream;
import javax.servlet.ServletRequest;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpHelper {
    private static final Logger LOGGER = LoggerFactory.getLogger(HttpHelper.class);

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static String getBodyString(ServletRequest request) {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = null;
        try (ServletInputStream inputStream = request.getInputStream();){
            reader = new BufferedReader(new InputStreamReader((InputStream)inputStream, StandardCharsets.UTF_8));
            String line = "";
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        catch (IOException e) {
            LOGGER.warn("getBodyString\u51fa\u73b0\u95ee\u9898\uff01");
        }
        finally {
            if (reader != null) {
                try {
                    reader.close();
                }
                catch (IOException e) {
                    LOGGER.error(ExceptionUtils.getMessage((Throwable)e));
                }
            }
        }
        return sb.toString();
    }
}

