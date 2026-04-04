/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.stripe.Stripe
 *  com.stripe.exception.StripeException
 *  com.stripe.model.Charge
 *  com.stripe.model.Customer
 *  com.stripe.model.PaymentIntent
 *  com.stripe.model.Refund
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.beans.factory.annotation.Value
 *  org.springframework.retry.annotation.Backoff
 *  org.springframework.retry.annotation.Recover
 *  org.springframework.retry.annotation.Retryable
 *  org.springframework.stereotype.Service
 */
package com.ruoyi.system.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
public class StripeService {
    private final String apiKey;

    @Autowired
    public StripeService(@Value(value="${stripe.api.key}") String apiKey) {
        this.apiKey = apiKey;
    }

    public Customer createCustomer(String email, String token) throws StripeException {
        Stripe.apiKey = this.apiKey;
        HashMap<String, Object> customerParams = new HashMap<String, Object>();
        customerParams.put("description", "Customer for " + email);
        customerParams.put("email", email);
        customerParams.put("source", token);
        return Customer.create(customerParams);
    }

    public Charge createCharge(String customerId, int amount) throws StripeException {
        Stripe.apiKey = this.apiKey;
        HashMap<String, Object> chargeParams = new HashMap<String, Object>();
        chargeParams.put("amount", amount);
        chargeParams.put("currency", "usd");
        chargeParams.put("customer", customerId);
        return Charge.create(chargeParams);
    }

    public Refund createRefund(String chargeId, int amount) throws StripeException {
        Stripe.apiKey = this.apiKey;
        HashMap<String, Object> refundParams = new HashMap<String, Object>();
        refundParams.put("charge", chargeId);
        refundParams.put("amount", amount);
        return Refund.create(refundParams);
    }

    @Retryable(value={Exception.class}, maxAttempts=3, backoff=@Backoff(delay=2000L))
    public Charge createChargeWithRetry(String customerId, int amount) throws StripeException {
        return this.createCharge(customerId, amount);
    }

    @Recover
    public Charge recoverFromChargeFailure(Exception e) {
        return null;
    }

    public PaymentIntent createPaymentIntent(Integer amount, String currency, String customerId, String description) throws StripeException {
        Stripe.apiKey = this.apiKey;
        HashMap<String, Object> params = new HashMap<String, Object>();
        params.put("amount", amount);
        params.put("currency", currency);
        params.put("description", description);
        if (customerId != null && !customerId.isEmpty()) {
            params.put("customer", customerId);
        }
        params.put("automatic_payment_methods", Map.of("enabled", true));
        return PaymentIntent.create(params);
    }
}

