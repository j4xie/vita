/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.servlet.http.HttpServletRequest
 */
package com.ruoyi.common.utils.ip;

import com.ruoyi.common.utils.ServletUtils;
import com.ruoyi.common.utils.StringUtils;
import java.net.InetAddress;
import java.net.UnknownHostException;
import javax.servlet.http.HttpServletRequest;

public class IpUtils {
    public static final String REGX_0_255 = "(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)";
    public static final String REGX_IP = "(((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d))";
    public static final String REGX_IP_WILDCARD = "(((\\*\\.){3}\\*)|((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)(\\.\\*){3})|((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)\\.(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d))(\\.\\*){2}|(((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)\\.){3}\\*))";
    public static final String REGX_IP_SEG = "((((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d))\\-(((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)))";

    public static String getIpAddr() {
        return IpUtils.getIpAddr(ServletUtils.getRequest());
    }

    public static String getIpAddr(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String ip = request.getHeader("x-forwarded-for");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return "0:0:0:0:0:0:0:1".equals(ip) ? "127.0.0.1" : IpUtils.getMultistageReverseProxyIp(ip);
    }

    public static boolean internalIp(String ip) {
        byte[] addr = IpUtils.textToNumericFormatV4(ip);
        return IpUtils.internalIp(addr) || "127.0.0.1".equals(ip);
    }

    private static boolean internalIp(byte[] addr) {
        if (StringUtils.isNull(addr) || addr.length < 2) {
            return true;
        }
        byte b0 = addr[0];
        byte b1 = addr[1];
        int SECTION_1 = 10;
        int SECTION_2 = -84;
        int SECTION_3 = 16;
        int SECTION_4 = 31;
        int SECTION_5 = -64;
        int SECTION_6 = -88;
        switch (b0) {
            case 10: {
                return true;
            }
            case -84: {
                if (b1 >= 16 && b1 <= 31) {
                    return true;
                }
            }
            case -64: {
                switch (b1) {
                    case -88: {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public static byte[] textToNumericFormatV4(String text) {
        if (text.length() == 0) {
            return null;
        }
        byte[] bytes = new byte[4];
        String[] elements = text.split("\\.", -1);
        try {
            switch (elements.length) {
                case 1: {
                    long l = Long.parseLong(elements[0]);
                    if (l < 0L || l > 0xFFFFFFFFL) {
                        return null;
                    }
                    bytes[0] = (byte)(l >> 24 & 0xFFL);
                    bytes[1] = (byte)((l & 0xFFFFFFL) >> 16 & 0xFFL);
                    bytes[2] = (byte)((l & 0xFFFFL) >> 8 & 0xFFL);
                    bytes[3] = (byte)(l & 0xFFL);
                    break;
                }
                case 2: {
                    long l = Integer.parseInt(elements[0]);
                    if (l < 0L || l > 255L) {
                        return null;
                    }
                    bytes[0] = (byte)(l & 0xFFL);
                    l = Integer.parseInt(elements[1]);
                    if (l < 0L || l > 0xFFFFFFL) {
                        return null;
                    }
                    bytes[1] = (byte)(l >> 16 & 0xFFL);
                    bytes[2] = (byte)((l & 0xFFFFL) >> 8 & 0xFFL);
                    bytes[3] = (byte)(l & 0xFFL);
                    break;
                }
                case 3: {
                    long l;
                    for (int i = 0; i < 2; ++i) {
                        l = Integer.parseInt(elements[i]);
                        if (l < 0L || l > 255L) {
                            return null;
                        }
                        bytes[i] = (byte)(l & 0xFFL);
                    }
                    l = Integer.parseInt(elements[2]);
                    if (l < 0L || l > 65535L) {
                        return null;
                    }
                    bytes[2] = (byte)(l >> 8 & 0xFFL);
                    bytes[3] = (byte)(l & 0xFFL);
                    break;
                }
                case 4: {
                    for (int i = 0; i < 4; ++i) {
                        long l = Integer.parseInt(elements[i]);
                        if (l < 0L || l > 255L) {
                            return null;
                        }
                        bytes[i] = (byte)(l & 0xFFL);
                    }
                    break;
                }
                default: {
                    return null;
                }
            }
        }
        catch (NumberFormatException e) {
            return null;
        }
        return bytes;
    }

    public static String getHostIp() {
        try {
            return InetAddress.getLocalHost().getHostAddress();
        }
        catch (UnknownHostException unknownHostException) {
            return "127.0.0.1";
        }
    }

    public static String getHostName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        }
        catch (UnknownHostException unknownHostException) {
            return "\u672a\u77e5";
        }
    }

    public static String getMultistageReverseProxyIp(String ip) {
        if (ip != null && ip.indexOf(",") > 0) {
            String[] ips;
            for (String subIp : ips = ip.trim().split(",")) {
                if (IpUtils.isUnknown(subIp)) continue;
                ip = subIp;
                break;
            }
        }
        return StringUtils.substring(ip, 0, 255);
    }

    public static boolean isUnknown(String checkString) {
        return StringUtils.isBlank((CharSequence)checkString) || "unknown".equalsIgnoreCase(checkString);
    }

    public static boolean isIP(String ip) {
        return StringUtils.isNotBlank((CharSequence)ip) && ip.matches(REGX_IP);
    }

    public static boolean isIpWildCard(String ip) {
        return StringUtils.isNotBlank((CharSequence)ip) && ip.matches(REGX_IP_WILDCARD);
    }

    public static boolean ipIsInWildCardNoCheck(String ipWildCard, String ip) {
        String[] s1 = ipWildCard.split("\\.");
        String[] s2 = ip.split("\\.");
        boolean isMatchedSeg = true;
        for (int i = 0; i < s1.length && !s1[i].equals("*"); ++i) {
            if (s1[i].equals(s2[i])) continue;
            isMatchedSeg = false;
            break;
        }
        return isMatchedSeg;
    }

    public static boolean isIPSegment(String ipSeg) {
        return StringUtils.isNotBlank((CharSequence)ipSeg) && ipSeg.matches(REGX_IP_SEG);
    }

    public static boolean ipIsInNetNoCheck(String iparea, String ip) {
        int idx = iparea.indexOf(45);
        String[] sips = iparea.substring(0, idx).split("\\.");
        String[] sipe = iparea.substring(idx + 1).split("\\.");
        String[] sipt = ip.split("\\.");
        long ips = 0L;
        long ipe = 0L;
        long ipt = 0L;
        for (int i = 0; i < 4; ++i) {
            ips = ips << 8 | (long)Integer.parseInt(sips[i]);
            ipe = ipe << 8 | (long)Integer.parseInt(sipe[i]);
            ipt = ipt << 8 | (long)Integer.parseInt(sipt[i]);
        }
        if (ips > ipe) {
            long t = ips;
            ips = ipe;
            ipe = t;
        }
        return ips <= ipt && ipt <= ipe;
    }

    public static boolean isMatchedIp(String filter, String ip) {
        String[] ips;
        if (StringUtils.isEmpty(filter) || StringUtils.isEmpty(ip)) {
            return false;
        }
        for (String iStr : ips = filter.split(";")) {
            if (IpUtils.isIP(iStr) && iStr.equals(ip)) {
                return true;
            }
            if (IpUtils.isIpWildCard(iStr) && IpUtils.ipIsInWildCardNoCheck(iStr, ip)) {
                return true;
            }
            if (!IpUtils.isIPSegment(iStr) || !IpUtils.ipIsInNetNoCheck(iStr, ip)) continue;
            return true;
        }
        return false;
    }
}

