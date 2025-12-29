package com.ruoyi.system.service.impl;

import com.aliyun.dysmsapi20180501.Client;
import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeRequest;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse;
import com.aliyun.tea.TeaException;
import com.aliyun.teaopenapi.models.Config;
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsRequest;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.aliyuncs.dysmsapi.model.v20170525.SendSmsRequest;
import com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.profile.DefaultProfile;
import com.aliyuncs.profile.IClientProfile;
import com.ruoyi.system.service.IAliyunSmsSenderService;
import com.ruoyi.system.sms.AliyunSMSConfig;
import com.ruoyi.system.sms.Sms;
import com.ruoyi.system.sms.SmsQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.text.SimpleDateFormat;
import java.util.Date;



/**
 * 发送短信封装服务实现类
 */
@Service
public class AliyunSmsSenderServiceImpl implements IAliyunSmsSenderService {
//    private Logger logger = Logger.getLogger(AliyunSmsSenderServiceImpl.class);
    private static final Logger log = LoggerFactory.getLogger(AliyunSmsSenderServiceImpl.class);

    @Resource
    private AliyunSMSConfig smsConfig;

    /**
     * @param phoneNumbers:      手机号
     * @param templateParamJson: 模板参数json {"sellerName":"123456","orderSn":"123456"}
     * @param templateCode:      阿里云短信模板code
     * @Author: LX 17839193044@162.com
     * @Description: 对接阿里云短信服务实现短信发送
     * 发送验证码类的短信时，每个号码每分钟最多发送一次，每个小时最多发送5次。其它类短信频控请参考阿里云
     * @Date: 2019/4/18 16:35
     * @Version: V1.0
     */
    @Override
    public SendSmsResponse sendSms(String phoneNumbers, String templateParamJson, String templateCode) {

        // 封装短信发送对象
        Sms sms = new Sms();
        sms.setPhoneNumbers(phoneNumbers);
        sms.setTemplateParam(templateParamJson);
        sms.setTemplateCode(templateCode);

        // 获取短信发送服务机
        IAcsClient acsClient = getClient();

        //获取短信请求
        SendSmsRequest request = getSmsRequest(sms);
        SendSmsResponse sendSmsResponse = new SendSmsResponse();

        try {
            sendSmsResponse = acsClient.getAcsResponse(request);
        } catch (ClientException e) {

            log.error("发送短信发生错误。错误代码是 [{}]，错误消息是 [{}]，错误请求ID是 [{}]，错误Msg是 [{}]，错误类型是 [{}]" + e.getErrCode() + e.getMessage()
                    + e.getRequestId()
                    + e.getErrMsg()
                    + e.getErrorType());
        }
        return sendSmsResponse;
    }

    /**
     * @param bizId:       短信对象的对应的bizId
     * @param phoneNumber: 手机号
     * @param pageSize:    分页大小
     * @param currentPage: 当前页码
     * @Author: LX 17839193044@162.com
     * @Description: 查询发送短信的内容
     * @Date: 2019/4/18 16:52
     * @Version: V1.0
     */
    @Override
    public QuerySendDetailsResponse querySendDetails(String bizId, String phoneNumber, Long pageSize, Long currentPage) {

        // 查询实体封装
        SmsQuery smsQuery = new SmsQuery();
        smsQuery.setBizId(bizId);
        smsQuery.setPhoneNumber(phoneNumber);
        smsQuery.setCurrentPage(currentPage);
        smsQuery.setPageSize(pageSize);
        smsQuery.setSendDate(new Date());

        // 获取短信发送服务机
        IAcsClient acsClient = getClient();
        QuerySendDetailsRequest request = getSmsQueryRequest(smsQuery);
        QuerySendDetailsResponse querySendDetailsResponse = null;
        try {
            querySendDetailsResponse = acsClient.getAcsResponse(request);
        } catch (ClientException e) {
            log.error("查询发送短信发生错误。错误代码是 [{}]，错误消息是 [{}]，错误请求ID是 [{}]，错误Msg是 [{}]，错误类型是 [{}]"
                    + e.getErrCode()
                    + e.getMessage()
                    + e.getRequestId()
                    + e.getErrMsg()
                    + e.getErrorType());
        }
        return querySendDetailsResponse;
    }

    /**
     * @param smsQuery:
     * @Author: LX 17839193044@162.com
     * @Description: 封装查询阿里云短信请求对象
     * @Date: 2019/4/18 16:51
     * @Version: V1.0
     */
    private QuerySendDetailsRequest getSmsQueryRequest(SmsQuery smsQuery) {
        QuerySendDetailsRequest request = new QuerySendDetailsRequest();
        request.setPhoneNumber(smsQuery.getPhoneNumber());
        request.setBizId(smsQuery.getBizId());
        SimpleDateFormat ft = new SimpleDateFormat(smsConfig.getDateFormat());
        request.setSendDate(ft.format(smsQuery.getSendDate()));
        request.setPageSize(smsQuery.getPageSize());
        request.setCurrentPage(smsQuery.getCurrentPage());
        return request;
    }


    /**
     * @param sms: 短信发送实体
     * @Author: LX 17839193044@162.com
     * @Description: 获取短信请求
     * @Date: 2019/4/18 16:40
     * @Version: V1.0
     */
    private SendSmsRequest getSmsRequest(Sms sms) {
        SendSmsRequest request = new SendSmsRequest();
        request.setPhoneNumbers(sms.getPhoneNumbers());
        request.setSignName(smsConfig.getSignName());
        request.setTemplateCode(sms.getTemplateCode());
        request.setTemplateParam(sms.getTemplateParam());
        request.setOutId(sms.getOutId());
        return request;
    }

    /**
     * @Author: LX 17839193044@162.com
     * @Description: 获取短信发送服务机
     * @Date: 2019/4/18 16:38
     * @Version: V1.0
     */
    private IAcsClient getClient() {

        IClientProfile profile = DefaultProfile.getProfile(smsConfig.getRegionId(),
                smsConfig.getAccessKeyId(),
                smsConfig.getAccessKeySecret());

        try {
            DefaultProfile.addEndpoint(smsConfig.getEndpointName(),
                    smsConfig.getRegionId(),
                    smsConfig.getProduct(),
                    smsConfig.getDomain());
        } catch (ClientException e) {
            log.error("获取短信发送服务机发生错误。错误代码是 [{}]，错误消息是 [{}]，错误请求ID是 [{}]，错误Msg是 [{}]，错误类型是 [{}]"
                    + e.getErrCode()
                    + e.getMessage()
                    + e.getRequestId()
                    + e.getErrMsg()
                    + e.getErrorType());
        }
        return new DefaultAcsClient(profile);
    }



    //------------------------------境外短信-------------------------------------------------


    @Override
    public SendMessageToGlobeResponse sendGlobeSms(String phoneNumbers, String content) {

        // 封装短信发送对象
        Sms sms = new Sms();
        sms.setPhoneNumbers(phoneNumbers);


        // 初始化请求客户端
        Client client = getGlobeClient();

        // 构造请求对象，请填入请求参数值
        SendMessageToGlobeRequest sendSmsRequest = getSmsGlobeRequest(sms, content);

        // 获取响应对象
        SendMessageToGlobeResponse sendMessageToGlobeResponse = new SendMessageToGlobeResponse();
        // 响应包含服务端响应的 body 和 headers
        //System.out.println(toJSONString(sendSmsResponse));

        try {
            sendMessageToGlobeResponse = client.sendMessageToGlobe(sendSmsRequest);
        } catch (ClientException e) {

            log.error("发送短信发生错误。错误代码是 [{}]，错误消息是 [{}]，错误请求ID是 [{}]，错误Msg是 [{}]，错误类型是 [{}]" + e.getErrCode() + e.getMessage()
                    + e.getRequestId()
                    + e.getErrMsg()
                    + e.getErrorType());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return sendMessageToGlobeResponse;
    }


    public Client getGlobeClient(){
        Config config = new Config()
                // 配置 AccessKey ID，请确保代码运行环境配置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID。
                .setAccessKeyId(smsConfig.getAccessKeyId())
                // 配置 AccessKey Secret，请确保代码运行环境配置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_SECRET。
                .setAccessKeySecret(smsConfig.getAccessKeySecret());
        // System.getenv()方法表示获取系统环境变量，不要直接在getenv()中填入AccessKey信息。

        // 配置 Endpoint。国际短信请使用dysmsapi.aliyuncs.com
        config.endpoint = "dysmsapi.ap-southeast-1.aliyuncs.com";

        try {
            return new Client(config);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private SendMessageToGlobeRequest getSmsGlobeRequest(Sms sms, String content) {
        SendMessageToGlobeRequest request = new SendMessageToGlobeRequest()
                .setFrom("18665282909")//公用：18773124359
                .setTo(sms.getPhoneNumbers())
                .setType("OTP")
                .setMessage(content);
        System.out.println("发送内容："+content);
        return request;
    }

    @Override
    public QueryMessageResponse queryGlobeSendDetails(String messageId) {

        com.aliyun.dysmsapi20180501.Client client = getGlobeClient();
        com.aliyun.dysmsapi20180501.models.QueryMessageRequest queryMessageRequest = new com.aliyun.dysmsapi20180501.models.QueryMessageRequest();
        queryMessageRequest.setMessageId(messageId);
        com.aliyun.teautil.models.RuntimeOptions runtime = new com.aliyun.teautil.models.RuntimeOptions();
        QueryMessageResponse queryMessageResponse = null;
        try {
            // Copy the code to run, please print the return value of the API by yourself.
            queryMessageResponse = client.queryMessageWithOptions(queryMessageRequest, runtime);
        } catch (TeaException error) {
            // Only a printing example. Please be careful about exception handling and do not ignore exceptions directly in engineering projects.
            // print error message
            System.out.println(error.getMessage());
            // Please click on the link below for diagnosis.
            System.out.println(error.getData().get("Recommend"));
            com.aliyun.teautil.Common.assertAsString(error.message);
        } catch (Exception _error) {
            TeaException error = new TeaException(_error.getMessage(), _error);
            // Only a printing example. Please be careful about exception handling and do not ignore exceptions directly in engineering projects.
            // print error message
            System.out.println(error.getMessage());
            // Please click on the link below for diagnosis.
            System.out.println(error.getData().get("Recommend"));
            com.aliyun.teautil.Common.assertAsString(error.message);
        }
        return queryMessageResponse;
    }

}
