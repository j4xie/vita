/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.annotation.Anonymous
 *  com.ruoyi.common.core.controller.BaseController
 *  com.ruoyi.common.core.domain.AjaxResult
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RequestParam
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.system.controller;

import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.pay.ApplePayConfig;
import com.ruoyi.system.pay.ApplePayUtils;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Anonymous
@RequestMapping(value={"/applepay"})
public class ApplePayController
extends BaseController {
    private static final Logger log = LoggerFactory.getLogger(ApplePayController.class);

    @PostMapping(value={"/generateSession"})
    public AjaxResult generateSession(@RequestParam String domainName, @RequestParam String displayName) {
        try {
            log.info("\u5f00\u59cb\u751f\u6210Apple Pay\u652f\u4ed8\u4f1a\u8bdd\uff0c\u57df\u540d: {}, \u663e\u793a\u540d\u79f0: {}", (Object)domainName, (Object)displayName);
            Map<String, Object> sessionData = ApplePayUtils.getInstance().generatePaymentSession(domainName, displayName);
            log.info("Apple Pay\u652f\u4ed8\u4f1a\u8bdd\u751f\u6210\u6210\u529f");
            return AjaxResult.success((String)"\u652f\u4ed8\u4f1a\u8bdd\u751f\u6210\u6210\u529f", sessionData);
        }
        catch (Exception e) {
            log.error("\u751f\u6210Apple Pay\u652f\u4ed8\u4f1a\u8bdd\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u751f\u6210\u652f\u4ed8\u4f1a\u8bdd\u5931\u8d25: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/processPayment"})
    public AjaxResult processPayment(@RequestParam String paymentToken, @RequestParam String amount, @RequestParam String currency, @RequestParam String orderId, @RequestParam(required=false) String description) {
        try {
            log.info("\u5f00\u59cb\u5904\u7406Apple Pay\u652f\u4ed8\u8bf7\u6c42\uff0c\u8ba2\u5355ID: {}, \u91d1\u989d: {}, \u8d27\u5e01: {}", new Object[]{orderId, amount, currency});
            Map<String, Object> paymentResult = ApplePayUtils.getInstance().processPayment(paymentToken, amount, currency, orderId);
            log.info("Apple Pay\u652f\u4ed8\u5904\u7406\u6210\u529f\uff0c\u8ba2\u5355ID: {}", (Object)orderId);
            return AjaxResult.success((String)"\u652f\u4ed8\u5904\u7406\u6210\u529f", paymentResult);
        }
        catch (Exception e) {
            log.error("\u5904\u7406Apple Pay\u652f\u4ed8\u8bf7\u6c42\u5f02\u5e38\uff0c\u8ba2\u5355ID: {}", (Object)orderId, (Object)e);
            return AjaxResult.error((String)("\u652f\u4ed8\u5904\u7406\u5931\u8d25: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/verifyToken"})
    public AjaxResult verifyToken(@RequestParam String paymentToken) {
        try {
            log.info("\u5f00\u59cb\u9a8c\u8bc1Apple Pay\u652f\u4ed8\u4ee4\u724c");
            boolean isValid = ApplePayUtils.getInstance().verifyPaymentToken(paymentToken);
            if (isValid) {
                log.info("Apple Pay\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u6210\u529f");
                return AjaxResult.success((String)"\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u6210\u529f");
            }
            log.error("Apple Pay\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u5931\u8d25");
            return AjaxResult.error((String)"\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u5931\u8d25");
        }
        catch (Exception e) {
            log.error("\u9a8c\u8bc1Apple Pay\u652f\u4ed8\u4ee4\u724c\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u9a8c\u8bc1\u652f\u4ed8\u4ee4\u724c\u5931\u8d25: " + e.getMessage()));
        }
    }

    @PostMapping(value={"/refund"})
    public AjaxResult refund(@RequestParam String orderId, @RequestParam String refundAmount, @RequestParam(required=false) String refundReason) {
        try {
            log.info("\u5f00\u59cb\u5904\u7406Apple Pay\u9000\u6b3e\u8bf7\u6c42\uff0c\u8ba2\u5355ID: {}, \u9000\u6b3e\u91d1\u989d: {}", (Object)orderId, (Object)refundAmount);
            Map<String, String> refundResult = Map.of("orderId", orderId, "refundAmount", ApplePayConfig.formatAmount(refundAmount), "refundReason", refundReason != null ? refundReason : "", "refundStatus", "SUCCESS");
            log.info("Apple Pay\u9000\u6b3e\u5904\u7406\u6210\u529f\uff0c\u8ba2\u5355ID: {}", (Object)orderId);
            return AjaxResult.success((String)"\u9000\u6b3e\u5904\u7406\u6210\u529f", refundResult);
        }
        catch (Exception e) {
            log.error("\u5904\u7406Apple Pay\u9000\u6b3e\u8bf7\u6c42\u5f02\u5e38\uff0c\u8ba2\u5355ID: {}", (Object)orderId, (Object)e);
            return AjaxResult.error((String)("\u9000\u6b3e\u5904\u7406\u5931\u8d25: " + e.getMessage()));
        }
    }

    @GetMapping(value={"/queryPayment"})
    public AjaxResult queryPayment(@RequestParam String orderId) {
        try {
            log.info("\u5f00\u59cb\u67e5\u8be2Apple Pay\u652f\u4ed8\u72b6\u6001\uff0c\u8ba2\u5355ID: {}", (Object)orderId);
            Map<String, String> paymentStatus = Map.of("orderId", orderId, "paymentStatus", "COMPLETED", "message", "\u652f\u4ed8\u6210\u529f");
            log.info("Apple Pay\u652f\u4ed8\u72b6\u6001\u67e5\u8be2\u6210\u529f\uff0c\u8ba2\u5355ID: {}", (Object)orderId);
            return AjaxResult.success((String)"\u67e5\u8be2\u652f\u4ed8\u72b6\u6001\u6210\u529f", paymentStatus);
        }
        catch (Exception e) {
            log.error("\u67e5\u8be2Apple Pay\u652f\u4ed8\u72b6\u6001\u5f02\u5e38\uff0c\u8ba2\u5355ID: {}", (Object)orderId, (Object)e);
            return AjaxResult.error((String)("\u67e5\u8be2\u652f\u4ed8\u72b6\u6001\u5931\u8d25: " + e.getMessage()));
        }
    }

    @GetMapping(value={"/config"})
    public AjaxResult getConfig() {
        try {
            log.info("\u83b7\u53d6Apple Pay\u914d\u7f6e\u4fe1\u606f");
            Map<String, String> configInfo = Map.of("merchantId", "merchant.com.yourcompany.appname", "environment", ApplePayConfig.getEnvironmentInfo(), "applePayUrl", ApplePayConfig.getApplePayUrl());
            log.info("\u83b7\u53d6Apple Pay\u914d\u7f6e\u4fe1\u606f\u6210\u529f");
            return AjaxResult.success((String)"\u83b7\u53d6\u914d\u7f6e\u4fe1\u606f\u6210\u529f", configInfo);
        }
        catch (Exception e) {
            log.error("\u83b7\u53d6Apple Pay\u914d\u7f6e\u4fe1\u606f\u5f02\u5e38", (Throwable)e);
            return AjaxResult.error((String)("\u83b7\u53d6\u914d\u7f6e\u4fe1\u606f\u5931\u8d25: " + e.getMessage()));
        }
    }
}

