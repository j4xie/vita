/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.poi.util.IOUtils
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils.file;

import com.ruoyi.common.config.RuoYiConfig;
import com.ruoyi.common.utils.StringUtils;
import java.io.ByteArrayInputStream;
import java.io.Closeable;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.Arrays;
import org.apache.poi.util.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ImageUtils {
    private static final Logger log = LoggerFactory.getLogger(ImageUtils.class);

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static byte[] getImage(String imagePath) {
        InputStream is = ImageUtils.getFile(imagePath);
        try {
            byte[] byArray = IOUtils.toByteArray((InputStream)is);
            return byArray;
        }
        catch (Exception e) {
            log.error("\u56fe\u7247\u52a0\u8f7d\u5f02\u5e38 {}", (Throwable)e);
            byte[] byArray = null;
            return byArray;
        }
        finally {
            IOUtils.closeQuietly((Closeable)is);
        }
    }

    public static InputStream getFile(String imagePath) {
        try {
            byte[] result = ImageUtils.readFile(imagePath);
            result = Arrays.copyOf(result, result.length);
            return new ByteArrayInputStream(result);
        }
        catch (Exception e) {
            log.error("\u83b7\u53d6\u56fe\u7247\u5f02\u5e38 {}", (Throwable)e);
            return null;
        }
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static byte[] readFile(String url) {
        InputStream in = null;
        try {
            Object localPath;
            if (url.startsWith("http")) {
                URL urlObj = new URL(url);
                URLConnection urlConnection = urlObj.openConnection();
                urlConnection.setConnectTimeout(30000);
                urlConnection.setReadTimeout(60000);
                urlConnection.setDoInput(true);
                in = urlConnection.getInputStream();
            } else {
                localPath = RuoYiConfig.getProfile();
                String downloadPath = (String)localPath + StringUtils.substringAfter((String)url, (String)"/profile");
                in = new FileInputStream(downloadPath);
            }
            localPath = IOUtils.toByteArray((InputStream)in);
            IOUtils.closeQuietly((Closeable)in);
            return localPath;
        }
        catch (Exception e) {
            log.error("\u83b7\u53d6\u6587\u4ef6\u8def\u5f84\u5f02\u5e38 {}", (Throwable)e);
            byte[] byArray = null;
            return byArray;
        }
        finally {
            IOUtils.closeQuietly(in);
        }
    }
}

