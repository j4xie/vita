package com.ruoyi.system.service;


import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse;

/**
 * @Author: LX 17839193044@162.com
 * @Description: 阿里云短信发送service
 * @Date: 17:31 2019/4/18
 * @Version: V1.0
 */
public interface IAliyunSmsSenderService {

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
    SendSmsResponse sendSms(String phoneNumbers, String templateParamJson, String templateCode);

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
    QuerySendDetailsResponse querySendDetails(String bizId, String phoneNumber, Long pageSize, Long currentPage);


    /**
     * 境外发送短信
     * @param phoneNumbers
     * @param content
     * @return
     */
    SendMessageToGlobeResponse sendGlobeSms(String phoneNumbers, String content);

    /**
     * 查询境外发送的短信
     * @param messageId
     * @return
     */
    public QueryMessageResponse queryGlobeSendDetails(String messageId);
}
