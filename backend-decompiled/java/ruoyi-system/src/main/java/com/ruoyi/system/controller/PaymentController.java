/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.stripe.exception.StripeException
 *  com.stripe.model.PaymentIntent
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.http.HttpStatus
 *  org.springframework.http.ResponseEntity
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.system.controller;

import com.ruoyi.system.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value={"/stripePay"})
public class PaymentController {
    @Autowired
    private final StripeService stripeService;

    @Autowired
    public PaymentController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping(value={"/create-payment-intent"})
    public ResponseEntity<?> createPaymentIntent(Integer amount, String currency, String customerId, String description) {
        try {
            if (amount == null || amount <= 0) {
                return ResponseEntity.badRequest().body((Object)"Amount must be greater than 0");
            }
            PaymentIntent paymentIntent = this.stripeService.createPaymentIntent(amount, currency, customerId, description);
            HashMap<String, String> response = new HashMap<String, String>();
            response.put("client_secret", paymentIntent.getClientSecret());
            response.put("payment_intent_id", paymentIntent.getId());
            response.put("status", paymentIntent.getStatus());
            return ResponseEntity.ok(response);
        }
        catch (StripeException e) {
            return ResponseEntity.status((HttpStatus)HttpStatus.INTERNAL_SERVER_ERROR).body((Object)e.getMessage());
        }
    }

    @PostMapping(value={"/create-customer"})
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> payload) {
        try {
            String customerId = String.valueOf(this.stripeService.createCustomer(payload.get("email"), payload.get("token")));
            return ResponseEntity.ok((Object)customerId);
        }
        catch (StripeException e) {
            return ResponseEntity.status((HttpStatus)HttpStatus.INTERNAL_SERVER_ERROR).body((Object)e.getMessage());
        }
    }

    @PostMapping(value={"/create-charge"})
    public ResponseEntity<?> createCharge(@RequestBody Map<String, Object> payload) {
        try {
            String chargeId = String.valueOf(this.stripeService.createChargeWithRetry((String)payload.get("customerId"), (Integer)payload.get("amount")));
            return ResponseEntity.ok((Object)chargeId);
        }
        catch (StripeException e) {
            return ResponseEntity.status((HttpStatus)HttpStatus.INTERNAL_SERVER_ERROR).body((Object)e.getMessage());
        }
    }

    @PostMapping(value={"/refund"})
    public ResponseEntity<?> createRefund(@RequestBody Map<String, Object> payload) {
        try {
            String refundId = String.valueOf(this.stripeService.createRefund((String)payload.get("chargeId"), (Integer)payload.get("amount")));
            return ResponseEntity.ok((Object)refundId);
        }
        catch (StripeException e) {
            return ResponseEntity.status((HttpStatus)HttpStatus.INTERNAL_SERVER_ERROR).body((Object)e.getMessage());
        }
    }
}

