package com.ruoyi.system.pay;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradeAppPayModel;
import com.alipay.api.domain.AlipayTradeQueryModel;
import com.alipay.api.request.AlipayTradeAppPayRequest;
import com.alipay.api.request.AlipayTradeQueryRequest;
import com.alipay.api.response.AlipayTradeAppPayResponse;
import com.alipay.api.response.AlipayTradeQueryResponse;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.controller.PayController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.Map;

/**
 * 支付宝支付相关接口
 */
public class AlipayUtils {
    private static final Logger log = LoggerFactory.getLogger(AlipayUtils.class);
    private static AlipayUtils alipayUtils = null;


    public static AlipayUtils getInstance(){
        if(null == alipayUtils){
            alipayUtils = new AlipayUtils();
        }

        return alipayUtils;
    }

    /**
     * alipay.trade.app.pay
     * app支付接口2.0
     * @param subject
     * @param totalAmount
     * @param outTradeNo
     * @return
     */
    public AlipayTradeAppPayResponse appPay(String subject, String totalAmount, String outTradeNo) {
        log.info("开始处理创建订单请求，订单标题: {}, 总金额: {}, 商户订单号: {}", subject, totalAmount, outTradeNo);
        AlipayClient alipayClient = createAlipayClient();
        AlipayTradeAppPayRequest request = new AlipayTradeAppPayRequest();
        AlipayTradeAppPayModel model = new AlipayTradeAppPayModel();
        model.setOutTradeNo(outTradeNo);
        model.setTotalAmount(totalAmount);
        model.setSubject(subject);
        request.setBizModel(model);
        AlipayTradeAppPayResponse response = null;
        try {
            response = alipayClient.sdkExecute(request);
        } catch (AlipayApiException e) {
            log.error("alipay.trade.app.pay，创建订单异常", e);
            throw new RuntimeException(e);
        }

        return response;
    }


    public AlipayTradeQueryResponse tradeQuery(String subject, String totalAmount, String outTradeNo) {
        AlipayClient alipayClient = createAlipayClient();
        AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();
        AlipayTradeQueryModel model = new AlipayTradeQueryModel();
        request.setBizModel(model);
        AlipayTradeQueryResponse response = null;
        try {
            alipayClient.execute(request);
        } catch (AlipayApiException e) {
            log.error("alipay.trade.app.pay，创建订单异常", e);
            throw new RuntimeException(e);
        }

        return response;
    }

    /**
     * 创建支付宝客户端实例
     * @return AlipayClient实例
     */
    private AlipayClient createAlipayClient() {
        // 使用默认构造函数创建客户端
        AlipayClient client = new DefaultAlipayClient(
                AlipayConfig.getGatewayUrl(),
                AlipayConfig.APP_ID,
                AlipayConfig.PRIVATE_KEY,
                "json",
                AlipayConfig.CHARSET,
                AlipayConfig.ALIPAY_PUBLIC_KEY,
                AlipayConfig.SIGN_TYPE);

        // 尝试通过反射设置超时参数
        try {
            // 尝试设置连接超时
            try {
                java.lang.reflect.Method setConnectTimeoutMethod = client.getClass().getMethod("setConnectTimeout", int.class);
                setConnectTimeoutMethod.invoke(client, 15000); // 15秒连接超时
                log.info("通过setter方法设置连接超时: 15秒");
            } catch (Exception e) {
                // 如果没有setter方法，尝试通过字段设置
                java.lang.reflect.Field connectTimeoutField = client.getClass().getDeclaredField("connectTimeout");
                connectTimeoutField.setAccessible(true);
                connectTimeoutField.set(client, 15000); // 15秒连接超时
                log.info("通过反射字段设置连接超时: 15秒");
            }

            // 尝试设置读取超时
            try {
                java.lang.reflect.Method setReadTimeoutMethod = client.getClass().getMethod("setReadTimeout", int.class);
                setReadTimeoutMethod.invoke(client, 60000); // 60秒读取超时
                log.info("通过setter方法设置读取超时: 60秒");
            } catch (Exception e) {
                // 如果没有setter方法，尝试通过字段设置
                java.lang.reflect.Field readTimeoutField = client.getClass().getDeclaredField("readTimeout");
                readTimeoutField.setAccessible(true);
                readTimeoutField.set(client, 60000); // 60秒读取超时
                log.info("通过反射字段设置读取超时: 60秒");
            }
        } catch (Exception e) {
            log.warn("无法设置支付宝客户端超时参数，使用默认超时设置", e);
        }

        return client;
    }
}
