package com.ruoyi.system.controller;

import com.ruoyi.system.service.StripeService;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.stripe.Stripe.apiKey;

@RestController
public class WebhookController {

    private final StripeService stripeService;

    @Autowired
    public WebhookController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestParam String signature) {
        Event event = null;
        try {
            event = Webhook.constructEvent(payload, signature, apiKey);
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    //stripeService.handlePaymentIntentSuccess(event);
                    break;
                case "charge.refunded":
                    //stripeService.handleChargeRefunded(event);
                    break;
                // 其他事件处理...
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: " + e.getMessage());
        }
        return ResponseEntity.ok("Event processed successfully");
    }

}
