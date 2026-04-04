/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.stripe.Stripe
 *  com.stripe.model.Event
 *  com.stripe.net.Webhook
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.http.HttpStatus
 *  org.springframework.http.ResponseEntity
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestBody
 *  org.springframework.web.bind.annotation.RequestParam
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.system.controller;

import com.ruoyi.system.service.StripeService;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebhookController {
    private final StripeService stripeService;

    @Autowired
    public WebhookController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping(value={"/webhook"})
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestParam String signature) {
        Event event = null;
        try {
            event = Webhook.constructEvent((String)payload, (String)signature, (String)Stripe.apiKey);
            switch (event.getType()) {
                case "payment_intent.succeeded": {
                    break;
                }
            }
        }
        catch (Exception e) {
            return ResponseEntity.status((HttpStatus)HttpStatus.BAD_REQUEST).body((Object)("Webhook error: " + e.getMessage()));
        }
        return ResponseEntity.ok((Object)"Event processed successfully");
    }
}

