package com.ruoyi.system.controller;

import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.system.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/stripePay")
public class PaymentController {

    @Autowired
    private final StripeService stripeService;

    @Autowired
    public PaymentController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(Integer amount, String currency, String customerId, String description) {
        try {
            // 获取金额、货币和客户信息
            /*Integer amount = (Integer) payload.get("amount");
            String currency = (String) payload.getOrDefault("currency", "usd");
            String customerId = (String) payload.get("customer_id");
            String description = (String) payload.getOrDefault("description", "Payment for services");*/
            
            if (amount == null || amount <= 0) {
                return ResponseEntity.badRequest().body("Amount must be greater than 0");
            }
            
            // 创建支付意图
            PaymentIntent paymentIntent = stripeService.createPaymentIntent(amount, currency, customerId, description);
            
            Map<String, Object> response = new HashMap<>();
            response.put("client_secret", paymentIntent.getClientSecret());
            response.put("payment_intent_id", paymentIntent.getId());
            response.put("status", paymentIntent.getStatus());
            
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/create-customer")
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> payload) {
        try {
            String customerId = String.valueOf(stripeService.createCustomer(payload.get("email"), payload.get("token")));
            return ResponseEntity.ok(customerId);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/create-charge")
    public ResponseEntity<?> createCharge(@RequestBody Map<String, Object> payload) {
        try {
            String chargeId = String.valueOf(stripeService.createChargeWithRetry((String) payload.get("customerId"), (int) payload.get("amount")));
            return ResponseEntity.ok(chargeId);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/refund")
    public ResponseEntity<?> createRefund(@RequestBody Map<String, Object> payload) {
        try {
            String refundId = String.valueOf(stripeService.createRefund((String) payload.get("chargeId"), (int) payload.get("amount")));
            return ResponseEntity.ok(refundId);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

}
