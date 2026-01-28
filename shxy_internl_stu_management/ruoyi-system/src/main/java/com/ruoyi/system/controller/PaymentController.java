package com.ruoyi.system.controller;

import com.ruoyi.system.service.StripeService;
import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class PaymentController {

    @Autowired
    private final StripeService stripeService;

    @Autowired
    public PaymentController(StripeService stripeService) {
        this.stripeService = stripeService;
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
