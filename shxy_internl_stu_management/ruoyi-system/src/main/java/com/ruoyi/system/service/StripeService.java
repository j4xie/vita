package com.ruoyi.system.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Customer;
import com.stripe.model.Refund;
import com.stripe.model.Subscription;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SubscriptionCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;


@Service
public class StripeService {

    private final String apiKey;

    @Autowired
    public StripeService(@Value("${stripe.api.key}") String apiKey) {
        this.apiKey = apiKey;
    }

    public Customer createCustomer(String email, String token) throws StripeException {
        Stripe.apiKey = apiKey;
        Map<String, Object> customerParams = new HashMap<>();
        customerParams.put("description", "Customer for " + email);
        customerParams.put("email", email);
        customerParams.put("source", token); // 通过 Stripe.js 获取
        return Customer.create(customerParams);
    }

    public Charge createCharge(String customerId, int amount) throws StripeException {
        Stripe.apiKey = apiKey;
        Map<String, Object> chargeParams = new HashMap<>();
        chargeParams.put("amount", amount);
        chargeParams.put("currency", "usd");
        chargeParams.put("customer", customerId);
        return Charge.create(chargeParams);
    }

    public Refund createRefund(String chargeId, int amount) throws StripeException {
        Stripe.apiKey = apiKey;
        Map<String, Object> refundParams = new HashMap<>();
        refundParams.put("charge", chargeId);
        refundParams.put("amount", amount);
        return Refund.create(refundParams);
    }

    // 添加失败重试机制
    @Retryable(value = {Exception.class}, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public Charge createChargeWithRetry(String customerId, int amount) throws StripeException {
        return createCharge(customerId, amount);
    }

    // 重试失败后的恢复方法
    @Recover
    public Charge recoverFromChargeFailure(Exception e) {
        // 记录日志、发送警报或执行其他恢复操作
        return null;
    }

}
