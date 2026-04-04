/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.aliyun.dysmsapi20180501.Client
 *  com.aliyun.dysmsapi20180501.models.QueryMessageRequest
 *  com.aliyun.dysmsapi20180501.models.QueryMessageResponse
 *  com.aliyun.dysmsapi20180501.models.SendMessageToGlobeRequest
 *  com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse
 *  com.aliyun.tea.TeaException
 *  com.aliyun.teaopenapi.models.Config
 *  com.aliyun.teautil.Common
 *  com.aliyun.teautil.models.RuntimeOptions
 *  com.aliyuncs.AcsRequest
 *  com.aliyuncs.DefaultAcsClient
 *  com.aliyuncs.IAcsClient
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsRequest
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.SendSmsRequest
 *  com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse
 *  com.aliyuncs.exceptions.ClientException
 *  com.aliyuncs.profile.DefaultProfile
 *  com.aliyuncs.profile.IClientProfile
 *  javax.annotation.Resource
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service.impl;

import com.aliyun.dysmsapi20180501.Client;
import com.aliyun.dysmsapi20180501.models.QueryMessageRequest;
import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeRequest;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse;
import com.aliyun.tea.TeaException;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.Common;
import com.aliyun.teautil.models.RuntimeOptions;
import com.aliyuncs.AcsRequest;
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
import java.text.SimpleDateFormat;
import java.util.Date;
import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AliyunSmsSenderServiceImpl
implements IAliyunSmsSenderService {
    private static final Logger log = LoggerFactory.getLogger(AliyunSmsSenderServiceImpl.class);
    @Resource
    private AliyunSMSConfig smsConfig;

    @Override
    public SendSmsResponse sendSms(String phoneNumbers, String templateParamJson, String templateCode) {
        Sms sms = new Sms();
        sms.setPhoneNumbers(phoneNumbers);
        sms.setTemplateParam(templateParamJson);
        sms.setTemplateCode(templateCode);
        IAcsClient acsClient = this.getClient();
        SendSmsRequest request = this.getSmsRequest(sms);
        SendSmsResponse sendSmsResponse = new SendSmsResponse();
        try {
            sendSmsResponse = (SendSmsResponse)acsClient.getAcsResponse((AcsRequest)request);
        }
        catch (ClientException e) {
            log.error("\u53d1\u9001\u77ed\u4fe1\u53d1\u751f\u9519\u8bef\u3002\u9519\u8bef\u4ee3\u7801\u662f [{}]\uff0c\u9519\u8bef\u6d88\u606f\u662f [{}]\uff0c\u9519\u8bef\u8bf7\u6c42ID\u662f [{}]\uff0c\u9519\u8befMsg\u662f [{}]\uff0c\u9519\u8bef\u7c7b\u578b\u662f [{}]" + e.getErrCode() + e.getMessage() + e.getRequestId() + e.getErrMsg() + e.getErrorType());
        }
        return sendSmsResponse;
    }

    @Override
    public QuerySendDetailsResponse querySendDetails(String bizId, String phoneNumber, Long pageSize, Long currentPage) {
        SmsQuery smsQuery = new SmsQuery();
        smsQuery.setBizId(bizId);
        smsQuery.setPhoneNumber(phoneNumber);
        smsQuery.setCurrentPage(currentPage);
        smsQuery.setPageSize(pageSize);
        smsQuery.setSendDate(new Date());
        IAcsClient acsClient = this.getClient();
        QuerySendDetailsRequest request = this.getSmsQueryRequest(smsQuery);
        QuerySendDetailsResponse querySendDetailsResponse = null;
        try {
            querySendDetailsResponse = (QuerySendDetailsResponse)acsClient.getAcsResponse((AcsRequest)request);
        }
        catch (ClientException e) {
            log.error("\u67e5\u8be2\u53d1\u9001\u77ed\u4fe1\u53d1\u751f\u9519\u8bef\u3002\u9519\u8bef\u4ee3\u7801\u662f [{}]\uff0c\u9519\u8bef\u6d88\u606f\u662f [{}]\uff0c\u9519\u8bef\u8bf7\u6c42ID\u662f [{}]\uff0c\u9519\u8befMsg\u662f [{}]\uff0c\u9519\u8bef\u7c7b\u578b\u662f [{}]" + e.getErrCode() + e.getMessage() + e.getRequestId() + e.getErrMsg() + e.getErrorType());
        }
        return querySendDetailsResponse;
    }

    private QuerySendDetailsRequest getSmsQueryRequest(SmsQuery smsQuery) {
        QuerySendDetailsRequest request = new QuerySendDetailsRequest();
        request.setPhoneNumber(smsQuery.getPhoneNumber());
        request.setBizId(smsQuery.getBizId());
        SimpleDateFormat ft = new SimpleDateFormat(this.smsConfig.getDateFormat());
        request.setSendDate(ft.format(smsQuery.getSendDate()));
        request.setPageSize(smsQuery.getPageSize());
        request.setCurrentPage(smsQuery.getCurrentPage());
        return request;
    }

    private SendSmsRequest getSmsRequest(Sms sms) {
        SendSmsRequest request = new SendSmsRequest();
        request.setPhoneNumbers(sms.getPhoneNumbers());
        request.setSignName(this.smsConfig.getSignName());
        request.setTemplateCode(sms.getTemplateCode());
        request.setTemplateParam(sms.getTemplateParam());
        request.setOutId(sms.getOutId());
        return request;
    }

    private IAcsClient getClient() {
        DefaultProfile profile = DefaultProfile.getProfile((String)this.smsConfig.getRegionId(), (String)this.smsConfig.getAccessKeyId(), (String)this.smsConfig.getAccessKeySecret());
        try {
            DefaultProfile.addEndpoint((String)this.smsConfig.getEndpointName(), (String)this.smsConfig.getRegionId(), (String)this.smsConfig.getProduct(), (String)this.smsConfig.getDomain());
        }
        catch (ClientException e) {
            log.error("\u83b7\u53d6\u77ed\u4fe1\u53d1\u9001\u670d\u52a1\u673a\u53d1\u751f\u9519\u8bef\u3002\u9519\u8bef\u4ee3\u7801\u662f [{}]\uff0c\u9519\u8bef\u6d88\u606f\u662f [{}]\uff0c\u9519\u8bef\u8bf7\u6c42ID\u662f [{}]\uff0c\u9519\u8befMsg\u662f [{}]\uff0c\u9519\u8bef\u7c7b\u578b\u662f [{}]" + e.getErrCode() + e.getMessage() + e.getRequestId() + e.getErrMsg() + e.getErrorType());
        }
        return new DefaultAcsClient((IClientProfile)profile);
    }

    @Override
    public SendMessageToGlobeResponse sendGlobeSms(String phoneNumbers, String content) {
        Sms sms = new Sms();
        sms.setPhoneNumbers(phoneNumbers);
        Client client = this.getGlobeClient();
        SendMessageToGlobeRequest sendSmsRequest = this.getSmsGlobeRequest(sms, content);
        SendMessageToGlobeResponse sendMessageToGlobeResponse = new SendMessageToGlobeResponse();
        try {
            sendMessageToGlobeResponse = client.sendMessageToGlobe(sendSmsRequest);
        }
        catch (ClientException e) {
            log.error("\u53d1\u9001\u77ed\u4fe1\u53d1\u751f\u9519\u8bef\u3002\u9519\u8bef\u4ee3\u7801\u662f [{}]\uff0c\u9519\u8bef\u6d88\u606f\u662f [{}]\uff0c\u9519\u8bef\u8bf7\u6c42ID\u662f [{}]\uff0c\u9519\u8befMsg\u662f [{}]\uff0c\u9519\u8bef\u7c7b\u578b\u662f [{}]" + e.getErrCode() + e.getMessage() + e.getRequestId() + e.getErrMsg() + e.getErrorType());
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
        return sendMessageToGlobeResponse;
    }

    public Client getGlobeClient() {
        Config config = new Config().setAccessKeyId(this.smsConfig.getAccessKeyId()).setAccessKeySecret(this.smsConfig.getAccessKeySecret());
        config.endpoint = "dysmsapi.ap-southeast-1.aliyuncs.com";
        try {
            return new Client(config);
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private SendMessageToGlobeRequest getSmsGlobeRequest(Sms sms, String content) {
        SendMessageToGlobeRequest request = new SendMessageToGlobeRequest().setFrom("18665282909").setTo(sms.getPhoneNumbers()).setType("OTP").setMessage(content);
        System.out.println("\u53d1\u9001\u5185\u5bb9\uff1a" + content);
        return request;
    }

    @Override
    public QueryMessageResponse queryGlobeSendDetails(String messageId) {
        Client client = this.getGlobeClient();
        QueryMessageRequest queryMessageRequest = new QueryMessageRequest();
        queryMessageRequest.setMessageId(messageId);
        RuntimeOptions runtime = new RuntimeOptions();
        QueryMessageResponse queryMessageResponse = null;
        try {
            queryMessageResponse = client.queryMessageWithOptions(queryMessageRequest, runtime);
        }
        catch (TeaException error) {
            System.out.println(error.getMessage());
            System.out.println(error.getData().get("Recommend"));
            Common.assertAsString((Object)error.message);
        }
        catch (Exception _error) {
            TeaException error = new TeaException(_error.getMessage(), (Throwable)_error);
            System.out.println(error.getMessage());
            System.out.println(error.getData().get("Recommend"));
            Common.assertAsString((Object)error.message);
        }
        return queryMessageResponse;
    }
}

