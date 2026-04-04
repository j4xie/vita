/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.alipay.api.AlipayApiException
 *  com.alipay.api.AlipayClient
 *  com.alipay.api.AlipayObject
 *  com.alipay.api.AlipayRequest
 *  com.alipay.api.DefaultAlipayClient
 *  com.alipay.api.domain.AlipayTradeAppPayModel
 *  com.alipay.api.domain.AlipayTradeQueryModel
 *  com.alipay.api.request.AlipayTradeAppPayRequest
 *  com.alipay.api.request.AlipayTradeQueryRequest
 *  com.alipay.api.response.AlipayTradeAppPayResponse
 *  com.alipay.api.response.AlipayTradeQueryResponse
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.system.pay;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.AlipayObject;
import com.alipay.api.AlipayRequest;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradeAppPayModel;
import com.alipay.api.domain.AlipayTradeQueryModel;
import com.alipay.api.request.AlipayTradeAppPayRequest;
import com.alipay.api.request.AlipayTradeQueryRequest;
import com.alipay.api.response.AlipayTradeAppPayResponse;
import com.alipay.api.response.AlipayTradeQueryResponse;
import com.ruoyi.system.pay.AlipayConfig;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AlipayUtils {
    private static final Logger log = LoggerFactory.getLogger(AlipayUtils.class);
    private static AlipayUtils alipayUtils = null;

    public static AlipayUtils getInstance() {
        if (null == alipayUtils) {
            alipayUtils = new AlipayUtils();
        }
        return alipayUtils;
    }

    public AlipayTradeAppPayResponse appPay(String subject, String totalAmount, String outTradeNo) {
        log.info("\u5f00\u59cb\u5904\u7406\u521b\u5efa\u8ba2\u5355\u8bf7\u6c42\uff0c\u8ba2\u5355\u6807\u9898: {}, \u603b\u91d1\u989d: {}, \u5546\u6237\u8ba2\u5355\u53f7: {}", new Object[]{subject, totalAmount, outTradeNo});
        AlipayClient alipayClient = this.createAlipayClient();
        AlipayTradeAppPayRequest request = new AlipayTradeAppPayRequest();
        AlipayTradeAppPayModel model = new AlipayTradeAppPayModel();
        model.setOutTradeNo(outTradeNo);
        model.setTotalAmount(totalAmount);
        model.setSubject(subject);
        request.setBizModel((AlipayObject)model);
        AlipayTradeAppPayResponse response = null;
        try {
            response = (AlipayTradeAppPayResponse)alipayClient.sdkExecute((AlipayRequest)request);
        }
        catch (AlipayApiException e) {
            log.error("alipay.trade.app.pay\uff0c\u521b\u5efa\u8ba2\u5355\u5f02\u5e38", (Throwable)e);
            throw new RuntimeException(e);
        }
        return response;
    }

    public AlipayTradeQueryResponse tradeQuery(String subject, String totalAmount, String outTradeNo) {
        AlipayClient alipayClient = this.createAlipayClient();
        AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();
        AlipayTradeQueryModel model = new AlipayTradeQueryModel();
        request.setBizModel((AlipayObject)model);
        AlipayTradeQueryResponse response = null;
        try {
            alipayClient.execute((AlipayRequest)request);
        }
        catch (AlipayApiException e) {
            log.error("alipay.trade.app.pay\uff0c\u521b\u5efa\u8ba2\u5355\u5f02\u5e38", (Throwable)e);
            throw new RuntimeException(e);
        }
        return response;
    }

    private AlipayClient createAlipayClient() {
        DefaultAlipayClient client = new DefaultAlipayClient(AlipayConfig.getGatewayUrl(), "2021006101688526", "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCW/PyBNyS582biMxDajrBOv2KXgN1Lkqx/ShqlMIynHqi/oMKN6Majpc9n9zYVMOdhNmiOKCM+jWxgZ/f8GYSGZUGjh9x2HQrVH+71nHc8JsFpbO8vUEx1X0NLp+eEvex1DEUwAEUD5s9towsWV8vEzmMAHBGttjAlH7G7Y2pzyR6R6qodc+J6dxxzS9rVoTi1cI+loYdAzZZTurrgJKUB5pE8GkEha9wEPAe3ssqu3PyRyKaNQ3iv35Be/LOD/MJ0wm7W/7kOxNUSLD76SC0A/ZkY8Lc4pHBIhnxCNtbvqYkZ8HjznWwFix4WXz0ZRPGwtKRNWiKWeUFYdzMqKWOFAgMBAAECggEAYT5k3lAGrmCudacQBsN5l+45cHxFiqPXx0+R46xmGkhrxKekRkOSk9l5wGr+gR1zGDAznMMLGAF7uIedttc0fF6ArPMWsVe5H1Sm0bdJMAuB7AWF8wITjFCjhfmI6fxsa2JQuT6jNIUWOXWV8XjwOzv1lR9+31OEpJRKIvc/m3wAlw/BfNQZYoU8o4w/QdJtHq+jT7Znl5iU2wYwzUNwefaaEuLmYcpIzMix3wMZoJ9an4oBS2BTBE/8Y4fiMcyvPCoir5SOUq1EkAbbC2f0K+nBdD2/iHwg8Ajb9p+pzWm216EzdcLC0h1Eh7bD2kSexNW/2lyl4MvSvpFPhHAQzQKBgQDfGJYczUgimgRJc/rskOC43SDn9ORzw4K2Q4M5gWYnq62KpfdkIxpcszsxVj0UlIkOe71rQ/Q37ZYOKVkB4PfGSxVvqOrRjiZRe8OQFk7Vzp0JmFbyWh4/m9QnNoq8CVG5FVEUelXRNm82Ybnr9EDpVU4QZAJJ0YoqYVL1sTZejwKBgQCtQdU5lN3B9ZmEr8YKx6yYH2nNMEIUu5Xr6Snj7jrRm7vhDY0fFhPDey7IRnCt9YsbwbMKZMS2aT77Q9LuIz3YPxbYV1KUmQV6oju12HZnl2jLb/BQDHst800ZsKTkIcDQu01IfvFw5OgCMR39bzmUsARpIL6RtVetp8rGIcEmqwKBgEjAv9NMroV6LIO3qtCSvnYKxrxeBFIsI+hEQ/rw09uEBOf+D5s8R1CLsnX4ZZrchYWPnMnqMy458IFVwoz2TFcCDU+IimskLCLOdYv7emIHKvcCEvidotejfZ/8DWocr+XnqbU/39SGJ+ZYIEVuNezhwL9fnc9s4d3IN0GgNNbJAoGAaHuE/L6bpPZZaD0gLywPF4YKJeVuVFZzqNrpmjz2V6WU/blQW2jS7lYA9mIUXbPv+gMr157BSkfZ5WkXcOjryNbzDfBLKrXFKhlf7N/nN72FQvn0cDG2rxVEb7OpHLKGNtpdVtTHAY/pojjAny9OCC7F2igXBIPZpi3ECQweERUCgYEAnrIUjoJFx0mXWcX57+Y4g9+ykoWZ/4znwYCXa/jYS3gzbvxEgG/C41SKTN8mD433bcEnZbyaxbJcMv79r/yg6ICFX3XdG4V4Gs7zMzhwkKT2m7MDVQ1XazYFAoucyH3hEDQX/0zrqbwY1zpSxV+qPxKHpNwvPST/o6tGwLQd/mU=", "json", "UTF-8", "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApWkN30V3Au5eJl2P+WkXrdqXQ9ASgcp2zhFJ747yQRSzV1FiUOe/ajadEfu4rFZNLNffn6/yOCq6VQQj5KZzsk18LXtz4zAvT4PNI4iLMu7TccnnVg1hhlq0kStOpU+IbvadJ940nX0vA8vJuZTm20ELPSrgGFVlWk7jIc/ShD3/XlHqAkXzrIO5Zs+E2VSm21ifDH/3twsuNueA/33a1bjLfJ5a/LTOaylO3qVXluqx1bxM/CpRBFjEX5n4vY2VfDS+25d0Xg6PQQQY8qs/ZghsuJ938ZqmxuqmOt0Kj3rAvB9QmTB7b8J8KD3zqYNhcEeAmtDBhWFDKwvXLiA7YQIDAQAB", "RSA2");
        try {
            try {
                Method setConnectTimeoutMethod = client.getClass().getMethod("setConnectTimeout", Integer.TYPE);
                setConnectTimeoutMethod.invoke((Object)client, 15000);
                log.info("\u901a\u8fc7setter\u65b9\u6cd5\u8bbe\u7f6e\u8fde\u63a5\u8d85\u65f6: 15\u79d2");
            }
            catch (Exception e) {
                Field connectTimeoutField = client.getClass().getDeclaredField("connectTimeout");
                connectTimeoutField.setAccessible(true);
                connectTimeoutField.set(client, 15000);
                log.info("\u901a\u8fc7\u53cd\u5c04\u5b57\u6bb5\u8bbe\u7f6e\u8fde\u63a5\u8d85\u65f6: 15\u79d2");
            }
            try {
                Method setReadTimeoutMethod = client.getClass().getMethod("setReadTimeout", Integer.TYPE);
                setReadTimeoutMethod.invoke((Object)client, 60000);
                log.info("\u901a\u8fc7setter\u65b9\u6cd5\u8bbe\u7f6e\u8bfb\u53d6\u8d85\u65f6: 60\u79d2");
            }
            catch (Exception e) {
                Field readTimeoutField = client.getClass().getDeclaredField("readTimeout");
                readTimeoutField.setAccessible(true);
                readTimeoutField.set(client, 60000);
                log.info("\u901a\u8fc7\u53cd\u5c04\u5b57\u6bb5\u8bbe\u7f6e\u8bfb\u53d6\u8d85\u65f6: 60\u79d2");
            }
        }
        catch (Exception e) {
            log.warn("\u65e0\u6cd5\u8bbe\u7f6e\u652f\u4ed8\u5b9d\u5ba2\u6237\u7aef\u8d85\u65f6\u53c2\u6570\uff0c\u4f7f\u7528\u9ed8\u8ba4\u8d85\u65f6\u8bbe\u7f6e", (Throwable)e);
        }
        return client;
    }
}

