package com.ruoyi.system.controller;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse;
import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.system.service.impl.AliyunSmsSenderServiceImpl;
import org.apache.http.util.TextUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@RestController
@Anonymous
@RequestMapping("/sms")
public class SmsController {

//    @Value("${servlet.context-path}")
//    private String contextPath;

    private String GN_TEMPLATE = "SMS_493200020";//国内验证码短信模板
    private String INTERL_TEMPLATE = "SMS_493900525";//国际/港澳台-验证码短信模板

    @Autowired
    private AliyunSmsSenderServiceImpl aliyunSmsSenderServiceImpl;

//    @RequestMapping("/test")
//    private String appointUser(Model model) {
//        model.addAttribute("contextPath", contextPath);
//        return "test/test";
//    }

    /**
     * @Author:
     * @Description: 通知短信发送
     * @Date: 2019/4/18 16:08
     * @Version: V1.0
     * return： {"bizId":"697021969738061031^0","code":"OK","message":"OK","requestId":"C3663BA3-9E1E-4785-8113-4470BB481A0E"}
     */
    @RequestMapping("/notifySms")
    @ResponseBody
    public JSONObject notifySms(String phoneNum) {
        Map<String, String> map = new HashMap<>();
        SendSmsResponse sendSmsResponse = null;
        try {
            map.put("code", "张,4321");
            sendSmsResponse = aliyunSmsSenderServiceImpl.sendSms(phoneNum,
                    JSON.toJSONString(map),
                    "SMS_174992476");
            System.out.println(JSON.toJSONString(sendSmsResponse));
        } catch (Exception e) {
            e.printStackTrace();
        }
        JSONObject obj = (JSONObject) JSON.parse(JSON.toJSONString(sendSmsResponse));

        return obj;
    }

    /**
     * 验证码短信发送
     * areaCode--国家级区号
     * @param phoneNum
     * @return
     */
    @RequestMapping("/vercodeSms")
    @ResponseBody
    public JSONObject vercodeSms(String phoneNum, String areaCode) {
        Map<String, String> map = new HashMap<>();
        SendSmsResponse sendSmsResponse = null;
        SendMessageToGlobeResponse sendMessageToGlobeResponse = null;
        try {
            String template = "";
            if(TextUtils.isEmpty(areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)){
                template = GN_TEMPLATE;
            }else{
                template = INTERL_TEMPLATE;
            }

            //生成验证码---------
            String verCode = "";
            Random random = new Random();
            int[] numbers = new int[6];
            for (int i = 0; i < numbers.length; i++) {
                numbers[i] = random.nextInt(10); // 生成0到9之间的随机数
            }
            for (int number : numbers) {
                verCode = verCode + (number + "");
                //System.out.print(number + " ");
            }
            //---------------
            map.put("code", verCode);
            if(TextUtils.isEmpty(areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)){
                sendSmsResponse = aliyunSmsSenderServiceImpl.sendSms(phoneNum,
                        JSON.toJSONString(map),
                        template);
                if("OK".equals(sendSmsResponse.getCode())){
                    sendSmsResponse.setMessage(verCode);
                }
                System.out.println(JSON.toJSONString(sendSmsResponse));
            }else{
                sendMessageToGlobeResponse = aliyunSmsSenderServiceImpl.sendGlobeSms(areaCode+phoneNum,
                        "Your verification code is: " + verCode + ". Please do not disclose it to others!");
                sendSmsResponse = new SendSmsResponse();
                sendSmsResponse.setBizId(sendMessageToGlobeResponse.getBody().messageId);
                sendSmsResponse.setCode(sendMessageToGlobeResponse.getBody().responseCode);
                sendSmsResponse.setRequestId(sendMessageToGlobeResponse.getBody().requestId);
                if("OK".equals(sendSmsResponse.getCode())){
                    sendSmsResponse.setMessage(verCode);
                }
                System.out.println(JSON.toJSONString(sendMessageToGlobeResponse));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        if(TextUtils.isEmpty(areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)){
            JSONObject obj = (JSONObject) JSON.parse(JSON.toJSONString(sendSmsResponse));

            return obj;
        }else{
            JSONObject obj = (JSONObject) JSON.parse(JSON.toJSONString(sendSmsResponse));

            return obj;
        }

    }

    /**
     * @Author: LX 17839193044@162.com
     * @Description: 短信查询
     * @Date: 2019/4/18 16:08
     * @Version: V1.0
     */
    @PostMapping("/check")
    public JSONObject query(String phoneNum, String bizId, String areaCode) {
        if(TextUtils.isEmpty(areaCode) || "86".equals(areaCode) || "+86".equals(areaCode)){
            QuerySendDetailsResponse querySendDetailsResponse = aliyunSmsSenderServiceImpl.querySendDetails(bizId,
                    phoneNum, 10L, 1L);
            JSONObject obj = (JSONObject) JSON.parse(JSON.toJSONString(querySendDetailsResponse));
            return obj;
        }else{
            QueryMessageResponse querySendDetailsResponse = aliyunSmsSenderServiceImpl.queryGlobeSendDetails(bizId);
            JSONObject obj = (JSONObject) JSON.parse(JSON.toJSONString(querySendDetailsResponse));
            System.out.println("查询："+querySendDetailsResponse.getBody().getMessage());
            return obj;
        }

    }

}
