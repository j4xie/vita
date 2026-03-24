package com.ruoyi.system.email;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.postmarkapp.postmark.Postmark;
import com.postmarkapp.postmark.client.ApiClient;
import com.postmarkapp.postmark.client.Parameters;
import com.postmarkapp.postmark.client.data.model.messages.OutboundMessages;

/**
 * 校验邮箱服务
 */
public class EmailCheckService {

    String apiKey = "60a1e028-6641-4f4a-8503-4bba73b41ecf";
    private static EmailCheckService emailCheckService = null;

    public static EmailCheckService getInstance()
    {
        if(null == emailCheckService){
            emailCheckService =  new EmailCheckService();
        }
        return emailCheckService;
    }

    public boolean hasEmailVeryCode(String toEmail, String veryCode) {
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
                String _veryCode = messages.getMessages().get(0).getMetadata().get("verCode");
                if(veryCode.equals(_veryCode)){
                    return true;
                }else{
                    return false;
                }
            }else{
                return false;
            }

        } catch (Exception e) {
            System.err.println("An error occurred: " + e.getMessage());
        }

        return false;
    }


}
