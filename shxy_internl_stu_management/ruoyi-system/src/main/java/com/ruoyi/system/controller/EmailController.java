package com.ruoyi.system.controller;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.postmarkapp.postmark.Postmark;
import com.postmarkapp.postmark.client.ApiClient;
import com.postmarkapp.postmark.client.data.model.message.Message;
import com.postmarkapp.postmark.client.data.model.message.MessageResponse;
import com.postmarkapp.postmark.client.exception.PostmarkException;
import com.ruoyi.common.utils.bean.BeanUtils;
import com.ruoyi.system.email.EmailMessageResponse;
import io.swagger.annotations.Api;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
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

}
