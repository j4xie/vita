/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alibaba.fastjson2.JSON
 *  com.alibaba.fastjson2.JSONObject
 *  com.aliyun.dysmsapi20180501.models.QueryMessageResponse
 *  com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse
 *  com.ruoyi.common.annotation.Anonymous
 *  org.apache.http.util.TextUtils
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.ResponseBody
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.system.controller;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse;
import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl;
import java.util.HashMap;
import java.util.Random;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Anonymous
@RequestMapping(value={"/sms"})
public class SmsController {
    private String GN_TEMPLATE = "SMS_493200020";
    private String INTERL_TEMPLATE = "SMS_493900525";
    @Autowired
    private AliyunSmsSenderServiceImpl aliyunSmsSenderServiceImpl;

    @RequestMapping(value={"/notifySms"})
    @ResponseBody
    public JSONObject notifySms(String phoneNum) {
        HashMap<String, String> map = new HashMap<String, String>();
        SendSmsResponse sendSmsResponse = null;
        try {
            map.put("code", "\u5f20,4321");
            sendSmsResponse = this.aliyunSmsSenderServiceImpl.sendSms(phoneNum, JSON.toJSONString(map), "SMS_174992476");
            System.out.println(JSON.toJSONString((Object)sendSmsResponse));
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        JSONObject obj = (JSONObject)JSON.parse((String)JSON.toJSONString(sendSmsResponse));
        return obj;
    }

    @RequestMapping(value={"/vercodeSms"})
    @ResponseBody
    public JSONObject vercodeSms(String phoneNum, String areaCode) {
        JSONObject obj;
        HashMap<String, String> map = new HashMap<String, String>();
        SendSmsResponse sendSmsResponse = null;
        SendMessageToGlobeResponse sendMessageToGlobeResponse = null;
        try {
            String template = "";
            template = TextUtils.isEmpty((CharSequence)areaCode) || "86".equals(areaCode) || "+86".equals(areaCode) ? this.GN_TEMPLATE : this.INTERL_TEMPLATE;
            Object verCode = "";
            Random random = new Random();
            int[] numbers = new int[6];
            for (int i = 0; i < numbers.length; ++i) {
                numbers[i] = random.nextInt(10);
            }
            for (int number : numbers) {
                verCode = (String)verCode + number;
            }
            map.put("code", (String)verCode);
            if (TextUtils.isEmpty((CharSequence)areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)) {
                sendSmsResponse = this.aliyunSmsSenderServiceImpl.sendSms(phoneNum, JSON.toJSONString(map), template);
                if ("OK".equals(sendSmsResponse.getCode())) {
                    sendSmsResponse.setMessage((String)verCode);
                }
                System.out.println(JSON.toJSONString((Object)sendSmsResponse));
            } else {
                sendMessageToGlobeResponse = this.aliyunSmsSenderServiceImpl.sendGlobeSms(areaCode + phoneNum, "Your verification code is: " + (String)verCode + ". Please do not disclose it to others!");
                sendSmsResponse = new SendSmsResponse();
                sendSmsResponse.setBizId(sendMessageToGlobeResponse.getBody().messageId);
                sendSmsResponse.setCode(sendMessageToGlobeResponse.getBody().responseCode);
                sendSmsResponse.setRequestId(sendMessageToGlobeResponse.getBody().requestId);
                if ("OK".equals(sendSmsResponse.getCode())) {
                    sendSmsResponse.setMessage((String)verCode);
                }
                System.out.println(JSON.toJSONString((Object)sendMessageToGlobeResponse));
            }
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        if (TextUtils.isEmpty((CharSequence)areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)) {
            obj = (JSONObject)JSON.parse((String)JSON.toJSONString(sendSmsResponse));
            return obj;
        }
        obj = (JSONObject)JSON.parse((String)JSON.toJSONString(sendSmsResponse));
        return obj;
    }

    @PostMapping(value={"/check"})
    public JSONObject query(String phoneNum, String bizId, String areaCode) {
        if (TextUtils.isEmpty((CharSequence)areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)) {
            QuerySendDetailsResponse querySendDetailsResponse = this.aliyunSmsSenderServiceImpl.querySendDetails(bizId, phoneNum, 10L, 1L);
            JSONObject obj = (JSONObject)JSON.parse((String)JSON.toJSONString((Object)querySendDetailsResponse));
            return obj;
        }
        QueryMessageResponse querySendDetailsResponse = this.aliyunSmsSenderServiceImpl.queryGlobeSendDetails(bizId);
        JSONObject obj = (JSONObject)JSON.parse((String)JSON.toJSONString((Object)querySendDetailsResponse));
        System.out.println("\u67e5\u8be2\uff1a" + querySendDetailsResponse.getBody().getMessage());
        return obj;
    }
}

