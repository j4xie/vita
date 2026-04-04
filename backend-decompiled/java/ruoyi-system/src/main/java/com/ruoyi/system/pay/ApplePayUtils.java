/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.databind.ObjectMapper
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.system.pay;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ruoyi.system.pay.ApplePayConfig;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.Signature;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Map;
import javax.net.ssl.HttpsURLConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ApplePayUtils {
    private static final Logger log = LoggerFactory.getLogger(ApplePayUtils.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static ApplePayUtils instance;

    private ApplePayUtils() {
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    public static ApplePayUtils getInstance() {
        if (instance != null) return instance;
        Class<ApplePayUtils> clazz = ApplePayUtils.class;
        synchronized (ApplePayUtils.class) {
            if (instance != null) return instance;
            instance = new ApplePayUtils();
            // ** MonitorExit[var0] (shouldn't be in output)
            return instance;
        }
    }

    public boolean verifyPaymentToken(String paymentToken) {
        try {
            log.info("\u5f00\u59cb\u9a8c\u8bc1Apple Pay\u652f\u4ed8\u4ee4\u724c");
            byte[] tokenBytes = Base64.getDecoder().decode(paymentToken);
            String tokenJson = new String(tokenBytes);
            log.info("\u652f\u4ed8\u4ee4\u724c\u89e3\u7801\u6210\u529f");
            Map tokenMap = (Map)objectMapper.readValue(tokenJson, Map.class);
            boolean signatureValid = this.validateSignature(tokenMap);
            if (signatureValid) {
                log.info("Apple Pay\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u6210\u529f");
                return true;
            }
            log.error("Apple Pay\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u5931\u8d25");
            return false;
        }
        catch (Exception e) {
            log.error("\u9a8c\u8bc1Apple Pay\u652f\u4ed8\u4ee4\u724c\u5f02\u5e38", (Throwable)e);
            return false;
        }
    }

    public Map<String, Object> processPayment(String paymentToken, String amount, String currency, String orderId) {
        try {
            log.info("\u5f00\u59cb\u5904\u7406Apple Pay\u652f\u4ed8\u8bf7\u6c42\uff0c\u8ba2\u5355ID: {}, \u91d1\u989d: {}, \u8d27\u5e01: {}", new Object[]{orderId, amount, currency});
            if (!this.verifyPaymentToken(paymentToken)) {
                log.error("\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u5931\u8d25\uff0c\u8ba2\u5355ID: {}", (Object)orderId);
                throw new Exception("\u652f\u4ed8\u4ee4\u724c\u9a8c\u8bc1\u5931\u8d25");
            }
            String response = this.callApplePayService(paymentToken, amount, currency, orderId);
            Map responseMap = (Map)objectMapper.readValue(response, Map.class);
            log.info("Apple Pay\u652f\u4ed8\u5904\u7406\u5b8c\u6210\uff0c\u8ba2\u5355ID: {}", (Object)orderId);
            return responseMap;
        }
        catch (Exception e) {
            log.error("\u5904\u7406Apple Pay\u652f\u4ed8\u8bf7\u6c42\u5f02\u5e38\uff0c\u8ba2\u5355ID: {}", (Object)orderId, (Object)e);
            throw new RuntimeException("\u5904\u7406\u652f\u4ed8\u8bf7\u6c42\u5931\u8d25: " + e.getMessage());
        }
    }

    private String callApplePayService(String paymentToken, String amount, String currency, String orderId) throws Exception {
        URL url = new URL(ApplePayConfig.getApplePayUrl());
        HttpsURLConnection connection = (HttpsURLConnection)url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);
        Map<String, String> requestBody = Map.of("paymentToken", paymentToken, "amount", ApplePayConfig.formatAmount(amount), "currency", currency, "orderId", orderId);
        String requestJson = objectMapper.writeValueAsString(requestBody);
        try (OutputStream os = connection.getOutputStream();){
            byte[] input = requestJson.getBytes("utf-8");
            os.write(input, 0, input.length);
        }
        int responseCode = connection.getResponseCode();
        if (responseCode == 200) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream(), "utf-8"));){
                StringBuilder response = new StringBuilder();
                String responseLine = null;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                String string = response.toString();
                return string;
            }
        }
        throw new Exception("Apple Pay\u670d\u52a1\u8c03\u7528\u5931\u8d25\uff0c\u54cd\u5e94\u7801: " + responseCode);
    }

    private boolean validateSignature(Map<String, Object> tokenMap) {
        try {
            Map header = (Map)tokenMap.get("header");
            String signature = (String)header.get("signature");
            String publicKeyHash = (String)header.get("publicKeyHash");
            String transactionId = (String)header.get("transactionId");
            KeyStore keyStore = this.loadMerchantCertificate();
            PublicKey publicKey = this.getPublicKey(keyStore);
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(publicKey);
            String dataToSign = transactionId + publicKeyHash;
            sig.update(dataToSign.getBytes());
            byte[] signatureBytes = Base64.getDecoder().decode(signature);
            return sig.verify(signatureBytes);
        }
        catch (Exception e) {
            log.error("\u9a8c\u8bc1\u7b7e\u540d\u5f02\u5e38", (Throwable)e);
            return false;
        }
    }

    private KeyStore loadMerchantCertificate() throws KeyStoreException, IOException, CertificateException, NoSuchAlgorithmException {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (FileInputStream fis = new FileInputStream("path/to/merchant/certificate.p12");){
            keyStore.load(fis, "your_certificate_password".toCharArray());
        }
        return keyStore;
    }

    private PublicKey getPublicKey(KeyStore keyStore) throws KeyStoreException {
        X509Certificate cert = (X509Certificate)keyStore.getCertificate(keyStore.aliases().nextElement());
        return cert.getPublicKey();
    }

    public Map<String, Object> generatePaymentSession(String domainName, String displayName) {
        try {
            log.info("\u5f00\u59cb\u751f\u6210Apple Pay\u652f\u4ed8\u4f1a\u8bdd\uff0c\u57df\u540d: {}", (Object)domainName);
            Map<String, Object> sessionData = Map.of("merchantIdentifier", "merchant.com.yourcompany.appname", "domainName", domainName, "displayName", displayName);
            log.info("Apple Pay\u652f\u4ed8\u4f1a\u8bdd\u751f\u6210\u6210\u529f");
            return sessionData;
        }
        catch (Exception e) {
            log.error("\u751f\u6210Apple Pay\u652f\u4ed8\u4f1a\u8bdd\u5f02\u5e38", (Throwable)e);
            throw new RuntimeException("\u751f\u6210\u652f\u4ed8\u4f1a\u8bdd\u5931\u8d25: " + e.getMessage());
        }
    }
}

