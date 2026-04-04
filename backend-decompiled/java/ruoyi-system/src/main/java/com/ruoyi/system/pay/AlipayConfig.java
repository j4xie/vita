/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.system.pay;

import java.lang.reflect.Field;

public class AlipayConfig {
    public static final String APP_ID = "2021006101688526";
    public static final String PRIVATE_KEY = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCW/PyBNyS582biMxDajrBOv2KXgN1Lkqx/ShqlMIynHqi/oMKN6Majpc9n9zYVMOdhNmiOKCM+jWxgZ/f8GYSGZUGjh9x2HQrVH+71nHc8JsFpbO8vUEx1X0NLp+eEvex1DEUwAEUD5s9towsWV8vEzmMAHBGttjAlH7G7Y2pzyR6R6qodc+J6dxxzS9rVoTi1cI+loYdAzZZTurrgJKUB5pE8GkEha9wEPAe3ssqu3PyRyKaNQ3iv35Be/LOD/MJ0wm7W/7kOxNUSLD76SC0A/ZkY8Lc4pHBIhnxCNtbvqYkZ8HjznWwFix4WXz0ZRPGwtKRNWiKWeUFYdzMqKWOFAgMBAAECggEAYT5k3lAGrmCudacQBsN5l+45cHxFiqPXx0+R46xmGkhrxKekRkOSk9l5wGr+gR1zGDAznMMLGAF7uIedttc0fF6ArPMWsVe5H1Sm0bdJMAuB7AWF8wITjFCjhfmI6fxsa2JQuT6jNIUWOXWV8XjwOzv1lR9+31OEpJRKIvc/m3wAlw/BfNQZYoU8o4w/QdJtHq+jT7Znl5iU2wYwzUNwefaaEuLmYcpIzMix3wMZoJ9an4oBS2BTBE/8Y4fiMcyvPCoir5SOUq1EkAbbC2f0K+nBdD2/iHwg8Ajb9p+pzWm216EzdcLC0h1Eh7bD2kSexNW/2lyl4MvSvpFPhHAQzQKBgQDfGJYczUgimgRJc/rskOC43SDn9ORzw4K2Q4M5gWYnq62KpfdkIxpcszsxVj0UlIkOe71rQ/Q37ZYOKVkB4PfGSxVvqOrRjiZRe8OQFk7Vzp0JmFbyWh4/m9QnNoq8CVG5FVEUelXRNm82Ybnr9EDpVU4QZAJJ0YoqYVL1sTZejwKBgQCtQdU5lN3B9ZmEr8YKx6yYH2nNMEIUu5Xr6Snj7jrRm7vhDY0fFhPDey7IRnCt9YsbwbMKZMS2aT77Q9LuIz3YPxbYV1KUmQV6oju12HZnl2jLb/BQDHst800ZsKTkIcDQu01IfvFw5OgCMR39bzmUsARpIL6RtVetp8rGIcEmqwKBgEjAv9NMroV6LIO3qtCSvnYKxrxeBFIsI+hEQ/rw09uEBOf+D5s8R1CLsnX4ZZrchYWPnMnqMy458IFVwoz2TFcCDU+IimskLCLOdYv7emIHKvcCEvidotejfZ/8DWocr+XnqbU/39SGJ+ZYIEVuNezhwL9fnc9s4d3IN0GgNNbJAoGAaHuE/L6bpPZZaD0gLywPF4YKJeVuVFZzqNrpmjz2V6WU/blQW2jS7lYA9mIUXbPv+gMr157BSkfZ5WkXcOjryNbzDfBLKrXFKhlf7N/nN72FQvn0cDG2rxVEb7OpHLKGNtpdVtTHAY/pojjAny9OCC7F2igXBIPZpi3ECQweERUCgYEAnrIUjoJFx0mXWcX57+Y4g9+ykoWZ/4znwYCXa/jYS3gzbvxEgG/C41SKTN8mD433bcEnZbyaxbJcMv79r/yg6ICFX3XdG4V4Gs7zMzhwkKT2m7MDVQ1XazYFAoucyH3hEDQX/0zrqbwY1zpSxV+qPxKHpNwvPST/o6tGwLQd/mU=";
    public static final String ALIPAY_PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApWkN30V3Au5eJl2P+WkXrdqXQ9ASgcp2zhFJ747yQRSzV1FiUOe/ajadEfu4rFZNLNffn6/yOCq6VQQj5KZzsk18LXtz4zAvT4PNI4iLMu7TccnnVg1hhlq0kStOpU+IbvadJ940nX0vA8vJuZTm20ELPSrgGFVlWk7jIc/ShD3/XlHqAkXzrIO5Zs+E2VSm21ifDH/3twsuNueA/33a1bjLfJ5a/LTOaylO3qVXluqx1bxM/CpRBFjEX5n4vY2VfDS+25d0Xg6PQQQY8qs/ZghsuJ938ZqmxuqmOt0Kj3rAvB9QmTB7b8J8KD3zqYNhcEeAmtDBhWFDKwvXLiA7YQIDAQAB";
    public static final String NOTIFY_URL = "http://106.14.165.234:8085/alipay/notify";
    public static final String RETURN_URL = "http://106.14.165.234:8085/alipay/return";
    public static final String SIGN_TYPE = "RSA2";
    public static final String CHARSET = "UTF-8";
    public static final String GATEWAY_URL = "https://openapi.alipay.com/gateway.do";
    public static final String GATEWAY_URL_SANDBOX = "https://openapi.alipaydev.com/gateway.do";
    public static final boolean USE_SANDBOX = false;

    public static String getGatewayUrl() {
        return GATEWAY_URL;
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

    public static String getSdkVersion() {
        try {
            Class<?> versionClass = Class.forName("com.alipay.api.Version");
            Field versionField = versionClass.getDeclaredField("VERSION");
            return (String)versionField.get(null);
        }
        catch (Exception e) {
            return "Unknown";
        }
    }

    public static boolean isSandbox() {
        return false;
    }

    public static String getConfigInfo() {
        return String.format("\u652f\u4ed8\u5b9d\u914d\u7f6e\u4fe1\u606f: APP_ID=%s, \u7f51\u5173\u5730\u5740=%s, SDK\u7248\u672c=%s, \u662f\u5426\u6c99\u7bb1\u73af\u5883=%s", APP_ID, AlipayConfig.getGatewayUrl(), AlipayConfig.getSdkVersion(), AlipayConfig.isSandbox());
    }

    public static String getGatewayInfo() {
        String gatewayUrl = AlipayConfig.getGatewayUrl();
        String environment = "\u751f\u4ea7\u73af\u5883";
        return String.format("\u652f\u4ed8\u5b9d\u7f51\u5173: %s (%s)", gatewayUrl, environment);
    }
}

