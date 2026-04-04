/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.pay;

public class ApplePayConfig {
    public static final String MERCHANT_ID = "merchant.com.yourcompany.appname";
    public static final String CERTIFICATE_PATH = "path/to/merchant/certificate.p12";
    public static final String CERTIFICATE_PASSWORD = "your_certificate_password";
    public static final String APPLE_PAY_URL = "https://apple-pay-gateway.apple.com/paymentservices/payment";
    public static final String APPLE_PAY_URL_SANDBOX = "https://apple-pay-gateway-sandbox.apple.com/paymentservices/payment";
    public static final boolean USE_SANDBOX = true;

    public static String getApplePayUrl() {
        return APPLE_PAY_URL_SANDBOX;
    }

    public static String formatAmount(String amount) {
        if (amount == null || amount.trim().isEmpty()) {
            return "0.00";
        }
        try {
            double amt = Double.parseDouble(amount);
            return String.format("%.2f", amt);
        }
        catch (NumberFormatException e) {
            return "0.00";
        }
    }

    public static boolean isSandbox() {
        return true;
    }

    public static String getConfigInfo() {
        return String.format("Apple Pay\u914d\u7f6e\u4fe1\u606f: MERCHANT_ID=%s, \u652f\u4ed8\u5904\u7406URL=%s, \u662f\u5426\u6c99\u7bb1\u73af\u5883=%s", MERCHANT_ID, ApplePayConfig.getApplePayUrl(), ApplePayConfig.isSandbox());
    }

    public static String getEnvironmentInfo() {
        String environment = "\u6c99\u7bb1\u73af\u5883";
        return String.format("Apple Pay\u73af\u5883: %s", environment);
    }
}

