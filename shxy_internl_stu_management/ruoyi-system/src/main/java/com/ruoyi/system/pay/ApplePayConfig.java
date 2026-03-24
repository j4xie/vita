package com.ruoyi.system.pay;

/**
 * Apple Pay配置类
 */
public class ApplePayConfig {
    
    // 商户ID (Merchant ID) - 从Apple Developer获取
    public static final String MERCHANT_ID = "merchant.com.yourcompany.appname";
    
    // 商户证书路径 - 用于验证Apple Pay支付令牌
    public static final String CERTIFICATE_PATH = "path/to/merchant/certificate.p12";
    
    // 商户证书密码
    public static final String CERTIFICATE_PASSWORD = "your_certificate_password";
    
    // Apple Pay支付处理URL
    public static final String APPLE_PAY_URL = "https://apple-pay-gateway.apple.com/paymentservices/payment";
    
    // 沙箱环境Apple Pay支付处理URL
    public static final String APPLE_PAY_URL_SANDBOX = "https://apple-pay-gateway-sandbox.apple.com/paymentservices/payment";
    
    // 是否使用沙箱环境
    public static final boolean USE_SANDBOX = true; // 开发测试时使用沙箱环境
    
    // 获取Apple Pay支付处理URL
    public static String getApplePayUrl() {
        return USE_SANDBOX ? APPLE_PAY_URL_SANDBOX : APPLE_PAY_URL;
    }
    
    // 格式化金额
    public static String formatAmount(String amount) {
        if (amount == null || amount.trim().isEmpty()) {
            return "0.00";
        }
        try {
            double amt = Double.parseDouble(amount);
            return String.format("%.2f", amt);
        } catch (NumberFormatException e) {
            return "0.00";
        }
    }
    
    // 检查是否使用沙箱环境
    public static boolean isSandbox() {
        return USE_SANDBOX;
    }
    
    // 获取完整配置信息
    public static String getConfigInfo() {
        return String.format("Apple Pay配置信息: MERCHANT_ID=%s, 支付处理URL=%s, 是否沙箱环境=%s", 
            MERCHANT_ID, getApplePayUrl(), isSandbox());
    }
    
    // 获取环境信息
    public static String getEnvironmentInfo() {
        String environment = USE_SANDBOX ? "沙箱环境" : "生产环境";
        return String.format("Apple Pay环境: %s", environment);
    }
}