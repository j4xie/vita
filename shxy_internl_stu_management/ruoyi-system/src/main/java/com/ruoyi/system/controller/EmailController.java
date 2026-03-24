package com.ruoyi.system.controller;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.postmarkapp.postmark.Postmark;
import com.postmarkapp.postmark.client.ApiClient;
import com.postmarkapp.postmark.client.Parameters;
import com.postmarkapp.postmark.client.data.model.message.Message;
import com.postmarkapp.postmark.client.data.model.message.MessageResponse;
import com.postmarkapp.postmark.client.data.model.messages.OutboundMessageDetails;
import com.postmarkapp.postmark.client.data.model.messages.OutboundMessages;
import com.postmarkapp.postmark.client.exception.PostmarkException;
import com.ruoyi.common.utils.bean.BeanUtils;
import com.ruoyi.system.email.EmailMessageResponse;
import io.swagger.annotations.Api;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ParseException;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Parameter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 邮件验证码控制器
 */
@RestController
@RequestMapping("/email")
public class EmailController {

    /**
     * 邮件验证码
     * @param email
     * @return
     */
    @RequestMapping("/vercodeEmail")
    @ResponseBody
    public JSONObject vercodeEmail(String email) {
        JSONObject obj = null;

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

        ApiClient client = Postmark.getApiClient("60a1e028-6641-4f4a-8503-4bba73b41ecf");//89ee791e-7eae-4ab6-b17c-46588e7d9575
        Message message = new Message("support@pomelo-x.com", email, "Pomelox verification email", "Your verification code is：" + verCode);
        Map<String, String> map = new HashMap<>();
        map.put("verCode", verCode);
        message.setMetadata(map);
        try {
            MessageResponse response = client.deliverMessage(message);
            if(response.getErrorCode() == 0){
                EmailMessageResponse responseDTO = new EmailMessageResponse();
                BeanUtils.copyProperties(response, responseDTO);
                responseDTO.setCode(verCode);
                obj = (JSONObject) JSON.parse(JSON.toJSONString(responseDTO));
            }else{
                obj = (JSONObject) JSON.parse(JSON.toJSONString(response));
            }
        } catch (PostmarkException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return obj;
    }


    /**
     * 查询已发送的邮件
     * @param
     * @return
     */
    @RequestMapping("/getSendEmail")
    @ResponseBody
    public JSONObject getSendEmail(String toEmail) {
        JSONObject obj = null;

        String apiKey = "60a1e028-6641-4f4a-8503-4bba73b41ecf";

        ApiClient client = Postmark.getApiClient(apiKey);//89ee791e-7eae-4ab6-b17c-46588e7d9575

        try {
            // 查询参数，可以根据需要设置更多参数，例如startDate, endDate, tag等
            Parameters parameters = new Parameters();
            //parameters.build("messageId", messageId);
            parameters.build("count", 1);
            parameters.build("offset", 0);
            parameters.build("recipient", toEmail);
            //OutboundMessageDetails messages = client.getMessageDetails(messageId);
            OutboundMessages messages = client.getMessages(parameters);
            if(messages.getMessages().size() > 0){
                System.out.println(messages.getMessages().get(0).getMetadata().get("verCode"));
            }

            obj = (JSONObject) JSON.parse(JSON.toJSONString(messages));
            //System.out.println("body="+obj.getString("htmlBody"));
            /*for (PostmarkMessage message : messages) {
                System.out.println("Subject: " + message.getSubject());
                System.out.println("To: " + message.getTo());
                System.out.println("Message ID: " + message.getMessageID());
                System.out.println("Status: " + message.getStatus());
                System.out.println("Sent At: " + message.getSentAt());
                // 可以根据需要打印更多信息
            }*/
        } catch (Exception e) {
            System.err.println("An error occurred: " + e.getMessage());
        }

        return obj;
    }

}
