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
 *  com.alipay.api.domain.AlipayTradeCloseModel
 *  com.alipay.api.domain.AlipayTradeFastpayRefundQueryModel
 *  com.alipay.api.domain.AlipayTradePagePayModel
 *  com.alipay.api.domain.AlipayTradeQueryModel
 *  com.alipay.api.domain.AlipayTradeRefundModel
 *  com.alipay.api.internal.util.AlipaySignature
 *  com.alipay.api.request.AlipayTradeAppPayRequest
 *  com.alipay.api.request.AlipayTradeCloseRequest
 *  com.alipay.api.request.AlipayTradeFastpayRefundQueryRequest
 *  com.alipay.api.request.AlipayTradePagePayRequest
 *  com.alipay.api.request.AlipayTradeQueryRequest
 *  com.alipay.api.request.AlipayTradeRefundRequest
 *  com.alipay.api.response.AlipayTradeAppPayResponse
 *  com.alipay.api.response.AlipayTradeCloseResponse
 *  com.alipay.api.response.AlipayTradeFastpayRefundQueryResponse
 *  com.alipay.api.response.AlipayTradePagePayResponse
 *  com.alipay.api.response.AlipayTradeQueryResponse
 *  com.alipay.api.response.AlipayTradeRefundResponse
 *  com.ruoyi.common.annotation.Anonymous
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  javax.servlet.http.HttpServletRequest
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RequestParam
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.system.controller;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.AlipayObject;
import com.alipay.api.AlipayRequest;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradeAppPayModel;
import com.alipay.api.domain.AlipayTradeCloseModel;
import com.alipay.api.domain.AlipayTradeFastpayRefundQueryModel;
import com.alipay.api.domain.AlipayTradePagePayModel;
import com.alipay.api.domain.AlipayTradeQueryModel;
import com.alipay.api.domain.AlipayTradeRefundModel;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradeAppPayRequest;
import com.alipay.api.request.AlipayTradeCloseRequest;
import com.alipay.api.request.AlipayTradeFastpayRefundQueryRequest;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.request.AlipayTradeQueryRequest;
import com.alipay.api.request.AlipayTradeRefundRequest;
import com.alipay.api.response.AlipayTradeAppPayResponse;
import com.alipay.api.response.AlipayTradeCloseResponse;
import com.alipay.api.response.AlipayTradeFastpayRefundQueryResponse;
import com.alipay.api.response.AlipayTradePagePayResponse;
import com.alipay.api.response.AlipayTradeQueryResponse;
import com.alipay.api.response.AlipayTradeRefundResponse;
import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.pay.AlipayConfig;
import com.ruoyi.system.pay.AlipayUtils;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Anonymous
@RequestMapping(value={"/alipay"})
public class PayController
extends BaseController {
    private static final Logger log = LoggerFactory.getLogger(PayController.class);

    @PostMapping(value={"/createOrder"})
    public AjaxResult createOrder(@RequestParam String subject, @RequestParam String totalAmount, @RequestParam String outTradeNo, @RequestParam(required=false) String body) {
        try {
            log.info("\u5f00\u59cb\u5904\u7406\u521b\u5efa\u8ba2\u5355\u8bf7\u6c42\uff0c\u8ba2\u5355\u6807\u9898: {}, \u603b\u91d1\u989d: {}, \u5546\u6237\u8ba2\u5355\u53f7: {}", new Object[]{subject, totalAmount, outTradeNo});
            AlipayTradeAppPayResponse response = AlipayUtils.getInstance().appPay(subject, totalAmount, outTradeNo);
            String orderStr = response.getBody();
            System.out.println(orderStr);
            if (response.isSuccess()) {
                System.out.println("\u8c03\u7528\u6210\u529f");
                HashMap<String, String> result = new HashMap<String, String>();
                result.put("orderString", response.getBody());
                result.put("outTradeNo", outTradeNo);
                log.info("\u8ba2\u5355\u521b\u5efa\u6210\u529f\uff0c\u5546\u6237\u8ba2\u5355\u53f7: {}", (Object)outTradeNo);
                return AjaxResult.success((String)"\u8ba2\u5355\u521b\u5efa\u6210\u529f", result);
            }
            System.out.println("\u8c03\u7528\u5931\u8d25");
            log.error("\u8ba2\u5355\u521b\u5efa\u5931\u8d25: {}\uff0c\u9519\u8bef\u7801: {}\uff0c\u5b50\u9519\u8bef\u7801: {}\uff0c\u5b50\u9519\u8bef\u4fe1\u606f: {}", new Object[]{response.getMsg(), response.getCode(), response.getSubCode(), response.getSubMsg()});
            return AjaxResult.error((String)("\u8ba2\u5355\u521b\u5efa\u5931\u8d25: " + response.getMsg() + " (\u9519\u8bef\u7801: " + response.getCode() + ", \u5b50\u9519\u8bef\u7801: " + response.getSubCode() + ", \u5b50\u9519\u8bef\u4fe1\u606f: " + response.getSubMsg() + ")"));
        }
        catch (Exception e) {
            log.error("\u521b\u5efa\u8ba2\u5355\u8fc7\u7a0b\u4e2d\u53d1\u751f\u672a\u9884\u671f\u7684\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u521b\u5efa\u8ba2\u5355\u8fc7\u7a0b\u4e2d\u53d1\u751f\u672a\u9884\u671f\u7684\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/appPay"})
    public AjaxResult appPay(@RequestParam String subject, @RequestParam String totalAmount, @RequestParam String outTradeNo, @RequestParam(required=false) String body) {
        try {
            log.info("\u5f00\u59cb\u5904\u7406APP\u652f\u4ed8\u8bf7\u6c42\uff0c\u8ba2\u5355\u6807\u9898: {}, \u603b\u91d1\u989d: {}, \u5546\u6237\u8ba2\u5355\u53f7: {}", new Object[]{subject, totalAmount, outTradeNo});
            AlipayClient alipayClient = this.createAlipayClient();
            AlipayTradeAppPayRequest request = new AlipayTradeAppPayRequest();
            AlipayTradeAppPayModel model = new AlipayTradeAppPayModel();
            model.setSubject(subject);
            model.setTotalAmount(AlipayConfig.formatAmount(totalAmount));
            model.setOutTradeNo(outTradeNo);
            if (body != null && !body.trim().isEmpty()) {
                model.setBody(body);
            }
            model.setTimeoutExpress("30m");
            model.setProductCode("QUICK_MSECURITY_PAY");
            request.setBizModel((AlipayObject)model);
            request.setNotifyUrl("http://106.14.165.234:8085/alipay/notify");
            log.info("\u51c6\u5907\u8c03\u7528\u652f\u4ed8\u5b9dAPP\u652f\u4ed8API\uff0c\u7f51\u5173\u5730\u5740: {}, APP_ID: {}", (Object)AlipayConfig.getGatewayUrl(), (Object)"2021006101688526");
            long startTime = System.currentTimeMillis();
            AlipayTradeAppPayResponse response = (AlipayTradeAppPayResponse)alipayClient.sdkExecute((AlipayRequest)request);
            long endTime = System.currentTimeMillis();
            log.info("\u652f\u4ed8\u5b9dAPP\u652f\u4ed8API\u8c03\u7528\u5b8c\u6210\uff0c\u8017\u65f6: {}ms", (Object)(endTime - startTime));
            if (response.isSuccess()) {
                HashMap<String, String> result = new HashMap<String, String>();
                result.put("orderString", response.getBody());
                result.put("outTradeNo", outTradeNo);
                log.info("APP\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u6210\u529f\uff0c\u5546\u6237\u8ba2\u5355\u53f7: {}", (Object)outTradeNo);
                return AjaxResult.success((String)"\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u6210\u529f", result);
            }
            log.error("APP\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5931\u8d25: {}\uff0c\u9519\u8bef\u7801: {}\uff0c\u5b50\u9519\u8bef\u7801: {}\uff0c\u5b50\u9519\u8bef\u4fe1\u606f: {}", new Object[]{response.getMsg(), response.getCode(), response.getSubCode(), response.getSubMsg()});
            return AjaxResult.error((String)("\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5931\u8d25: " + response.getMsg() + " (\u9519\u8bef\u7801: " + response.getCode() + ", \u5b50\u9519\u8bef\u7801: " + response.getSubCode() + ", \u5b50\u9519\u8bef\u4fe1\u606f: " + response.getSubMsg() + ")"));
        }
        catch (AlipayApiException e) {
            log.error("APP\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5f02\u5e38: " + e.getMessage()));
        }
        catch (Exception e) {
            log.error("APP\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u8fc7\u7a0b\u4e2d\u53d1\u751f\u672a\u9884\u671f\u7684\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u8fc7\u7a0b\u4e2d\u53d1\u751f\u672a\u9884\u671f\u7684\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/webPay"})
    public AjaxResult webPay(@RequestParam String subject, @RequestParam String totalAmount, @RequestParam String outTradeNo, @RequestParam(required=false) String body) {
        try {
            log.info("\u5f00\u59cb\u5904\u7406\u7f51\u9875\u652f\u4ed8\u8bf7\u6c42\uff0c\u8ba2\u5355\u6807\u9898: {}, \u603b\u91d1\u989d: {}, \u5546\u6237\u8ba2\u5355\u53f7: {}", new Object[]{subject, totalAmount, outTradeNo});
            AlipayClient alipayClient = this.createAlipayClient();
            AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
            request.setReturnUrl("http://106.14.165.234:8085/alipay/return");
            request.setNotifyUrl("http://106.14.165.234:8085/alipay/notify");
            AlipayTradePagePayModel model = new AlipayTradePagePayModel();
            model.setSubject(subject);
            model.setTotalAmount(AlipayConfig.formatAmount(totalAmount));
            model.setOutTradeNo(outTradeNo);
            if (body != null && !body.trim().isEmpty()) {
                model.setBody(body);
            }
            model.setTimeoutExpress("30m");
            model.setProductCode("FAST_INSTANT_TRADE_PAY");
            request.setBizModel((AlipayObject)model);
            log.info("\u51c6\u5907\u8c03\u7528\u652f\u4ed8\u5b9d\u7f51\u9875\u652f\u4ed8API\uff0c\u7f51\u5173\u5730\u5740: {}, APP_ID: {}", (Object)AlipayConfig.getGatewayUrl(), (Object)"2021006101688526");
            long startTime = System.currentTimeMillis();
            AlipayTradePagePayResponse response = (AlipayTradePagePayResponse)alipayClient.pageExecute((AlipayRequest)request);
            long endTime = System.currentTimeMillis();
            log.info("\u652f\u4ed8\u5b9d\u7f51\u9875\u652f\u4ed8API\u8c03\u7528\u5b8c\u6210\uff0c\u8017\u65f6: {}ms", (Object)(endTime - startTime));
            if (response.isSuccess()) {
                HashMap<String, String> result = new HashMap<String, String>();
                result.put("form", response.getBody());
                result.put("outTradeNo", outTradeNo);
                log.info("\u7f51\u9875\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u6210\u529f\uff0c\u5546\u6237\u8ba2\u5355\u53f7: {}", (Object)outTradeNo);
                return AjaxResult.success((String)"\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u6210\u529f", result);
            }
            log.error("\u7f51\u9875\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5931\u8d25: {}\uff0c\u9519\u8bef\u7801: {}\uff0c\u5b50\u9519\u8bef\u7801: {}\uff0c\u5b50\u9519\u8bef\u4fe1\u606f: {}", new Object[]{response.getMsg(), response.getCode(), response.getSubCode(), response.getSubMsg()});
            return AjaxResult.error((String)("\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5931\u8d25: " + response.getMsg() + " (\u9519\u8bef\u7801: " + response.getCode() + ", \u5b50\u9519\u8bef\u7801: " + response.getSubCode() + ", \u5b50\u9519\u8bef\u4fe1\u606f: " + response.getSubMsg() + ")"));
        }
        catch (AlipayApiException e) {
            log.error("\u7f51\u9875\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u5f02\u5e38: " + e.getMessage()));
        }
        catch (Exception e) {
            log.error("\u7f51\u9875\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u8fc7\u7a0b\u4e2d\u53d1\u751f\u672a\u9884\u671f\u7684\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u652f\u4ed8\u8ba2\u5355\u751f\u6210\u8fc7\u7a0b\u4e2d\u53d1\u751f\u672a\u9884\u671f\u7684\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/closeTrade"})
    public AjaxResult closeTrade(@RequestParam(required=false) String outTradeNo, @RequestParam(required=false) String tradeNo) {
        try {
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error((String)"\u5546\u6237\u8ba2\u5355\u53f7\u548c\u652f\u4ed8\u5b9d\u4ea4\u6613\u53f7\u4e0d\u80fd\u540c\u65f6\u4e3a\u7a7a");
            }
            AlipayClient alipayClient = this.createAlipayClient();
            AlipayTradeCloseRequest request = new AlipayTradeCloseRequest();
            AlipayTradeCloseModel model = new AlipayTradeCloseModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }
            request.setBizModel((AlipayObject)model);
            AlipayTradeCloseResponse response = (AlipayTradeCloseResponse)alipayClient.execute((AlipayRequest)request);
            if (response.isSuccess()) {
                HashMap<String, String> result = new HashMap<String, String>();
                result.put("tradeNo", response.getTradeNo());
                result.put("outTradeNo", response.getOutTradeNo());
                return AjaxResult.success((String)"\u4ea4\u6613\u5173\u95ed\u6210\u529f", result);
            }
            log.error("\u4ea4\u6613\u5173\u95ed\u5931\u8d25: {}", (Object)response.getMsg());
            return AjaxResult.error((String)("\u4ea4\u6613\u5173\u95ed\u5931\u8d25: " + response.getMsg()));
        }
        catch (AlipayApiException e) {
            log.error("\u5173\u95ed\u4ea4\u6613\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u5173\u95ed\u4ea4\u6613\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/refund"})
    public AjaxResult refund(@RequestParam(required=false) String outTradeNo, @RequestParam(required=false) String tradeNo, @RequestParam String refundAmount, @RequestParam(required=false) String refundReason, @RequestParam String outRequestNo) {
        try {
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error((String)"\u5546\u6237\u8ba2\u5355\u53f7\u548c\u652f\u4ed8\u5b9d\u4ea4\u6613\u53f7\u4e0d\u80fd\u540c\u65f6\u4e3a\u7a7a");
            }
            AlipayClient alipayClient = this.createAlipayClient();
            AlipayTradeRefundRequest request = new AlipayTradeRefundRequest();
            AlipayTradeRefundModel model = new AlipayTradeRefundModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }
            model.setRefundAmount(AlipayConfig.formatAmount(refundAmount));
            model.setRefundReason(refundReason);
            model.setOutRequestNo(outRequestNo);
            request.setBizModel((AlipayObject)model);
            AlipayTradeRefundResponse response = (AlipayTradeRefundResponse)alipayClient.execute((AlipayRequest)request);
            if (response.isSuccess()) {
                HashMap<String, String> result;
                block12: {
                    result = new HashMap<String, String>();
                    result.put("tradeNo", response.getTradeNo());
                    result.put("outTradeNo", response.getOutTradeNo());
                    try {
                        result.put("refundFee", response.getRefundFee());
                    }
                    catch (Exception e) {
                        log.warn("\u83b7\u53d6\u9000\u6b3e\u8d39\u7528\u5931\u8d25\uff0c\u5c1d\u8bd5\u4ece\u53c2\u6570\u4e2d\u83b7\u53d6: {}", (Object)e.getMessage());
                        if (response.getParams() == null) break block12;
                        result.put("refundFee", (String)response.getParams().get("refund_fee"));
                    }
                }
                try {
                    if (response.getParams() != null && response.getParams().get("out_request_no") != null) {
                        result.put("outRequestNo", (String)response.getParams().get("out_request_no"));
                    } else {
                        result.put("outRequestNo", outRequestNo);
                    }
                }
                catch (Exception e) {
                    log.warn("\u83b7\u53d6\u9000\u6b3e\u5355\u53f7\u5931\u8d25\uff0c\u4f7f\u7528\u4f20\u5165\u53c2\u6570: {}", (Object)e.getMessage());
                    result.put("outRequestNo", outRequestNo);
                }
                return AjaxResult.success((String)"\u9000\u6b3e\u6210\u529f", result);
            }
            log.error("\u9000\u6b3e\u5931\u8d25: {}", (Object)response.getMsg());
            return AjaxResult.error((String)("\u9000\u6b3e\u5931\u8d25: " + response.getMsg()));
        }
        catch (AlipayApiException e) {
            log.error("\u9000\u6b3e\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u9000\u6b3e\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @GetMapping(value={"/queryPayment"})
    public AjaxResult queryPayment(@RequestParam(required=false) String outTradeNo, @RequestParam(required=false) String tradeNo) {
        try {
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error((String)"\u5546\u6237\u8ba2\u5355\u53f7\u548c\u652f\u4ed8\u5b9d\u4ea4\u6613\u53f7\u4e0d\u80fd\u540c\u65f6\u4e3a\u7a7a");
            }
            AlipayClient alipayClient = this.createAlipayClient();
            AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();
            AlipayTradeQueryModel model = new AlipayTradeQueryModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }
            request.setBizModel((AlipayObject)model);
            AlipayTradeQueryResponse response = (AlipayTradeQueryResponse)alipayClient.execute((AlipayRequest)request);
            if (response.isSuccess()) {
                HashMap<String, String> result = new HashMap<String, String>();
                result.put("tradeNo", response.getTradeNo());
                result.put("outTradeNo", response.getOutTradeNo());
                result.put("tradeStatus", response.getTradeStatus());
                result.put("totalAmount", response.getTotalAmount());
                result.put("receiptAmount", response.getReceiptAmount());
                result.put("buyerPayAmount", response.getBuyerPayAmount());
                result.put("subject", response.getSubject());
                result.put("body", response.getBody());
                try {
                    if (response.getParams() != null) {
                        result.put("gmtPayment", (String)response.getParams().get("gmt_payment"));
                        result.put("gmtCreate", (String)response.getParams().get("gmt_create"));
                    }
                }
                catch (Exception e) {
                    log.warn("\u83b7\u53d6\u65f6\u95f4\u5b57\u6bb5\u5931\u8d25: {}", (Object)e.getMessage());
                }
                return AjaxResult.success((String)"\u67e5\u8be2\u6210\u529f", result);
            }
            log.error("\u67e5\u8be2\u652f\u4ed8\u5355\u5931\u8d25: {}", (Object)response.getMsg());
            return AjaxResult.error((String)("\u67e5\u8be2\u652f\u4ed8\u5355\u5931\u8d25: " + response.getMsg()));
        }
        catch (AlipayApiException e) {
            log.error("\u67e5\u8be2\u652f\u4ed8\u5355\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u67e5\u8be2\u652f\u4ed8\u5355\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @GetMapping(value={"/queryRefund"})
    public AjaxResult queryRefund(@RequestParam(required=false) String outTradeNo, @RequestParam(required=false) String tradeNo, @RequestParam String outRequestNo) {
        try {
            if (outRequestNo == null || outRequestNo.trim().isEmpty()) {
                return AjaxResult.error((String)"\u9000\u6b3e\u5355\u53f7\u4e0d\u80fd\u4e3a\u7a7a");
            }
            if ((outTradeNo == null || outTradeNo.trim().isEmpty()) && (tradeNo == null || tradeNo.trim().isEmpty())) {
                return AjaxResult.error((String)"\u5546\u6237\u8ba2\u5355\u53f7\u548c\u652f\u4ed8\u5b9d\u4ea4\u6613\u53f7\u4e0d\u80fd\u540c\u65f6\u4e3a\u7a7a");
            }
            AlipayClient alipayClient = this.createAlipayClient();
            AlipayTradeFastpayRefundQueryRequest request = new AlipayTradeFastpayRefundQueryRequest();
            AlipayTradeFastpayRefundQueryModel model = new AlipayTradeFastpayRefundQueryModel();
            if (outTradeNo != null && !outTradeNo.trim().isEmpty()) {
                model.setOutTradeNo(outTradeNo);
            }
            if (tradeNo != null && !tradeNo.trim().isEmpty()) {
                model.setTradeNo(tradeNo);
            }
            model.setOutRequestNo(outRequestNo);
            request.setBizModel((AlipayObject)model);
            AlipayTradeFastpayRefundQueryResponse response = (AlipayTradeFastpayRefundQueryResponse)alipayClient.execute((AlipayRequest)request);
            if (response.isSuccess()) {
                HashMap<String, String> result;
                block25: {
                    block24: {
                        block23: {
                            block22: {
                                result = new HashMap<String, String>();
                                result.put("tradeNo", response.getTradeNo());
                                result.put("outTradeNo", response.getOutTradeNo());
                                try {
                                    if (response.getParams() != null && response.getParams().get("out_request_no") != null) {
                                        result.put("outRequestNo", (String)response.getParams().get("out_request_no"));
                                    } else {
                                        result.put("outRequestNo", outRequestNo);
                                    }
                                }
                                catch (Exception e) {
                                    log.warn("\u83b7\u53d6\u9000\u6b3e\u5355\u53f7\u5931\u8d25\uff0c\u4f7f\u7528\u4f20\u5165\u53c2\u6570: {}", (Object)e.getMessage());
                                    result.put("outRequestNo", outRequestNo);
                                }
                                try {
                                    result.put("refundReason", response.getRefundReason());
                                }
                                catch (Exception e) {
                                    log.warn("\u83b7\u53d6\u9000\u6b3e\u539f\u56e0\u5931\u8d25: {}", (Object)e.getMessage());
                                    if (response.getParams() == null) break block22;
                                    result.put("refundReason", (String)response.getParams().get("refund_reason"));
                                }
                            }
                            try {
                                result.put("totalAmount", response.getTotalAmount());
                            }
                            catch (Exception e) {
                                log.warn("\u83b7\u53d6\u603b\u91d1\u989d\u5931\u8d25: {}", (Object)e.getMessage());
                                if (response.getParams() == null) break block23;
                                result.put("totalAmount", (String)response.getParams().get("total_amount"));
                            }
                        }
                        try {
                            result.put("refundAmount", response.getRefundAmount());
                        }
                        catch (Exception e) {
                            log.warn("\u83b7\u53d6\u9000\u6b3e\u91d1\u989d\u5931\u8d25: {}", (Object)e.getMessage());
                            if (response.getParams() == null) break block24;
                            result.put("refundAmount", (String)response.getParams().get("refund_amount"));
                        }
                    }
                    try {
                        result.put("refundStatus", response.getRefundStatus());
                    }
                    catch (Exception e) {
                        log.warn("\u83b7\u53d6\u9000\u6b3e\u72b6\u6001\u5931\u8d25: {}", (Object)e.getMessage());
                        if (response.getParams() == null) break block25;
                        result.put("refundStatus", (String)response.getParams().get("refund_status"));
                    }
                }
                try {
                    if (response.getParams() != null) {
                        result.put("gmtRefundPay", (String)response.getParams().get("gmt_refund_pay"));
                    }
                }
                catch (Exception e) {
                    log.warn("\u83b7\u53d6\u9000\u6b3e\u65f6\u95f4\u5931\u8d25: {}", (Object)e.getMessage());
                }
                return AjaxResult.success((String)"\u67e5\u8be2\u9000\u6b3e\u5355\u6210\u529f", result);
            }
            log.error("\u67e5\u8be2\u9000\u6b3e\u5355\u5931\u8d25: {}", (Object)response.getMsg());
            return AjaxResult.error((String)("\u67e5\u8be2\u9000\u6b3e\u5355\u5931\u8d25: " + response.getMsg()));
        }
        catch (AlipayApiException e) {
            log.error("\u67e5\u8be2\u9000\u6b3e\u5355\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u67e5\u8be2\u9000\u6b3e\u5355\u5f02\u5e38: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/notify"})
    public String notify(HttpServletRequest request) {
        try {
            HashMap<String, String> params = new HashMap<String, String>();
            Map requestParams = request.getParameterMap();
            for (String name : requestParams.keySet()) {
                String[] values = (String[])requestParams.get(name);
                Object valueStr = "";
                for (int i = 0; i < values.length; ++i) {
                    valueStr = i == values.length - 1 ? (String)valueStr + values[i] : (String)valueStr + values[i] + ",";
                }
                try {
                    valueStr = new String(((String)valueStr).getBytes("ISO-8859-1"), "utf-8");
                }
                catch (UnsupportedEncodingException e) {
                    log.error("\u5b57\u7b26\u7f16\u7801\u8f6c\u6362\u5f02\u5e38", (Throwable)e);
                }
                params.put(name, (String)valueStr);
            }
            boolean signVerified = AlipaySignature.rsaCheckV1(params, (String)"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApWkN30V3Au5eJl2P+WkXrdqXQ9ASgcp2zhFJ747yQRSzV1FiUOe/ajadEfu4rFZNLNffn6/yOCq6VQQj5KZzsk18LXtz4zAvT4PNI4iLMu7TccnnVg1hhlq0kStOpU+IbvadJ940nX0vA8vJuZTm20ELPSrgGFVlWk7jIc/ShD3/XlHqAkXzrIO5Zs+E2VSm21ifDH/3twsuNueA/33a1bjLfJ5a/LTOaylO3qVXluqx1bxM/CpRBFjEX5n4vY2VfDS+25d0Xg6PQQQY8qs/ZghsuJ938ZqmxuqmOt0Kj3rAvB9QmTB7b8J8KD3zqYNhcEeAmtDBhWFDKwvXLiA7YQIDAQAB", (String)"UTF-8", (String)"RSA2");
            if (signVerified) {
                String tradeStatus = (String)params.get("trade_status");
                String outTradeNo = (String)params.get("out_trade_no");
                String tradeNo = (String)params.get("trade_no");
                String totalAmount = (String)params.get("total_amount");
                log.info("\u652f\u4ed8\u5b9d\u5f02\u6b65\u901a\u77e5\u9a8c\u8bc1\u6210\u529f - \u8ba2\u5355\u53f7: {}, \u4ea4\u6613\u53f7: {}, \u4ea4\u6613\u72b6\u6001: {}, \u4ea4\u6613\u91d1\u989d: {}", new Object[]{outTradeNo, tradeNo, tradeStatus, totalAmount});
                if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                    log.info("\u652f\u4ed8\u6210\u529f\uff0c\u5904\u7406\u4e1a\u52a1\u903b\u8f91 - \u8ba2\u5355\u53f7: {}", (Object)outTradeNo);
                }
                return "success";
            }
            log.error("\u652f\u4ed8\u5b9d\u5f02\u6b65\u901a\u77e5\u9a8c\u8bc1\u5931\u8d25");
            return "failure";
        }
        catch (AlipayApiException e) {
            log.error("\u5904\u7406\u652f\u4ed8\u5b9d\u5f02\u6b65\u901a\u77e5\u5f02\u5e38", (Throwable)e);
            return "failure";
        }
    }

    @GetMapping(value={"/return"})
    public AjaxResult returnUrl(HttpServletRequest request) {
        try {
            System.out.println("return_url");
            HashMap<String, String> params = new HashMap<String, String>();
            Map requestParams = request.getParameterMap();
            for (String name : requestParams.keySet()) {
                String[] values = (String[])requestParams.get(name);
                Object valueStr = "";
                for (int i = 0; i < values.length; ++i) {
                    valueStr = i == values.length - 1 ? (String)valueStr + values[i] : (String)valueStr + values[i] + ",";
                }
                try {
                    valueStr = new String(((String)valueStr).getBytes("ISO-8859-1"), "utf-8");
                }
                catch (UnsupportedEncodingException e) {
                    log.error("\u5b57\u7b26\u7f16\u7801\u8f6c\u6362\u5f02\u5e38", (Throwable)e);
                }
                params.put(name, (String)valueStr);
            }
            boolean signVerified = AlipaySignature.rsaCheckV1(params, (String)"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApWkN30V3Au5eJl2P+WkXrdqXQ9ASgcp2zhFJ747yQRSzV1FiUOe/ajadEfu4rFZNLNffn6/yOCq6VQQj5KZzsk18LXtz4zAvT4PNI4iLMu7TccnnVg1hhlq0kStOpU+IbvadJ940nX0vA8vJuZTm20ELPSrgGFVlWk7jIc/ShD3/XlHqAkXzrIO5Zs+E2VSm21ifDH/3twsuNueA/33a1bjLfJ5a/LTOaylO3qVXluqx1bxM/CpRBFjEX5n4vY2VfDS+25d0Xg6PQQQY8qs/ZghsuJ938ZqmxuqmOt0Kj3rAvB9QmTB7b8J8KD3zqYNhcEeAmtDBhWFDKwvXLiA7YQIDAQAB", (String)"UTF-8", (String)"RSA2");
            if (signVerified) {
                String outTradeNo = (String)params.get("out_trade_no");
                String tradeNo = (String)params.get("trade_no");
                String totalAmount = (String)params.get("total_amount");
                log.info("\u652f\u4ed8\u5b9d\u540c\u6b65\u901a\u77e5\u9a8c\u8bc1\u6210\u529f - \u8ba2\u5355\u53f7: {}, \u4ea4\u6613\u53f7: {}, \u4ea4\u6613\u91d1\u989d: {}", new Object[]{outTradeNo, tradeNo, totalAmount});
                HashMap<String, String> result = new HashMap<String, String>();
                result.put("outTradeNo", outTradeNo);
                result.put("tradeNo", tradeNo);
                result.put("totalAmount", totalAmount);
                result.put("message", "\u652f\u4ed8\u6210\u529f");
                return AjaxResult.success((String)"\u652f\u4ed8\u6210\u529f", result);
            }
            log.error("\u652f\u4ed8\u5b9d\u540c\u6b65\u901a\u77e5\u9a8c\u8bc1\u5931\u8d25");
            return AjaxResult.error((String)"\u652f\u4ed8\u9a8c\u8bc1\u5931\u8d25");
        }
        catch (AlipayApiException e) {
            log.error("\u5904\u7406\u652f\u4ed8\u5b9d\u540c\u6b65\u901a\u77e5\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)"\u5904\u7406\u652f\u4ed8\u7ed3\u679c\u5f02\u5e38");
        }
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

