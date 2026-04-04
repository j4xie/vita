/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alibaba.fastjson2.JSON
 *  com.alibaba.fastjson2.JSONObject
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils.ip;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.ruoyi.common.config.RuoYiConfig;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.http.HttpUtils;
import com.ruoyi.common.utils.ip.IpUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AddressUtils {
    private static final Logger log = LoggerFactory.getLogger(AddressUtils.class);
    public static final String IP_URL = "http://whois.pconline.com.cn/ipJson.jsp";
    public static final String UNKNOWN = "XX XX";

    public static String getRealAddressByIP(String ip) {
        if (IpUtils.internalIp(ip)) {
            return "\u5185\u7f51IP";
        }
        if (RuoYiConfig.isAddressEnabled()) {
            try {
                String rspStr = HttpUtils.sendGet(IP_URL, "ip=" + ip + "&json=true", "GBK");
                if (StringUtils.isEmpty(rspStr)) {
                    log.error("\u83b7\u53d6\u5730\u7406\u4f4d\u7f6e\u5f02\u5e38 {}", (Object)ip);
                    return UNKNOWN;
                }
                JSONObject obj = JSON.parseObject((String)rspStr);
                String region = obj.getString("pro");
                String city = obj.getString("city");
                return String.format("%s %s", region, city);
            }
            catch (Exception e) {
                log.error("\u83b7\u53d6\u5730\u7406\u4f4d\u7f6e\u5f02\u5e38 {}", (Object)ip);
            }
        }
        return UNKNOWN;
    }
}

