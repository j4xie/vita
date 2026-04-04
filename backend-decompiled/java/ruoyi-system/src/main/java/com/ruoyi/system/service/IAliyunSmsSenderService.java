/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.aliyun.dysmsapi20180501.models.QueryMessageResponse
 *  com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse
 *  com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse
 */
package com.ruoyi.system.service;

import com.aliyun.dysmsapi20180501.models.QueryMessageResponse;
import com.aliyun.dysmsapi20180501.models.SendMessageToGlobeResponse;
import com.aliyuncs.dysmsapi.model.v20170525.QuerySendDetailsResponse;
import com.aliyuncs.dysmsapi.model.v20170525.SendSmsResponse;

public interface IAliyunSmsSenderService {
    public SendSmsResponse sendSms(String var1, String var2, String var3);

    public QuerySendDetailsResponse querySendDetails(String var1, String var2, Long var3, Long var4);

    public SendMessageToGlobeResponse sendGlobeSms(String var1, String var2);

    public QueryMessageResponse queryGlobeSendDetails(String var1);
}

