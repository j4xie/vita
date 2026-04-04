/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils.sign;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Md5Utils {
    private static final Logger log = LoggerFactory.getLogger(Md5Utils.class);

    private static byte[] md5(String s) {
        try {
            MessageDigest algorithm = MessageDigest.getInstance("MD5");
            algorithm.reset();
            algorithm.update(s.getBytes("UTF-8"));
            byte[] messageDigest = algorithm.digest();
            return messageDigest;
        }
        catch (Exception e) {
            log.error("MD5 Error...", (Throwable)e);
            return null;
        }
    }

    private static final String toHex(byte[] hash) {
        if (hash == null) {
            return null;
        }
        StringBuffer buf = new StringBuffer(hash.length * 2);
        for (int i = 0; i < hash.length; ++i) {
            if ((hash[i] & 0xFF) < 16) {
                buf.append("0");
            }
            buf.append(Long.toString(hash[i] & 0xFF, 16));
        }
        return buf.toString();
    }

    public static String hash(String s) {
        try {
            return new String(Md5Utils.toHex(Md5Utils.md5(s)).getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
        }
        catch (Exception e) {
            log.error("not supported charset...{}", (Throwable)e);
            return s;
        }
    }
}

