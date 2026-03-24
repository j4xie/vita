package com.ruoyi.system.pay;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.net.ssl.HttpsURLConnection;
import java.io.*;
import java.net.URL;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Map;

/**
 * Apple Pay工具类
 */
public class ApplePayUtils {
    
    private static final Logger log = LoggerFactory.getLogger(ApplePayUtils.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static ApplePayUtils instance;
    
    private ApplePayUtils() {
        // 私有构造方法
    }
    
    /**
     * 获取ApplePayUtils单例
     * @return ApplePayUtils实例
     */
    public static ApplePayUtils getInstance() {
        if (instance == null) {
            synchronized (ApplePayUtils.class) {
                if (instance == null) {
                    instance = new ApplePayUtils();
                }
            }
        }
        return instance;
    }
    
    /**
     * 验证Apple Pay支付令牌
     * @param paymentToken 支付令牌（Base64编码）
     * @return 验证结果
     */
    public boolean verifyPaymentToken(String paymentToken) {
        try {
            log.info("开始验证Apple Pay支付令牌");
            
            // 解码支付令牌
            byte[] tokenBytes = Base64.getDecoder().decode(paymentToken);
            String tokenJson = new String(tokenBytes);
            
            log.info("支付令牌解码成功");
            
            // 解析支付令牌
            Map<String, Object> tokenMap = objectMapper.readValue(tokenJson, Map.class);
            
            // 验证签名
            boolean signatureValid = validateSignature(tokenMap);
            
            if (signatureValid) {
                log.info("Apple Pay支付令牌验证成功");
                return true;
            } else {
                log.error("Apple Pay支付令牌验证失败");
                return false;
            }
        } catch (Exception e) {
            log.error("验证Apple Pay支付令牌异常", e);
            return false;
        }
    }
    
    /**
     * 处理Apple Pay支付请求
     * @param paymentToken 支付令牌
     * @param amount 支付金额
     * @param currency 货币代码
     * @param orderId 订单ID
     * @return 支付结果
     */
    public Map<String, Object> processPayment(String paymentToken, String amount, String currency, String orderId) {
        try {
            log.info("开始处理Apple Pay支付请求，订单ID: {}, 金额: {}, 货币: {}", orderId, amount, currency);
            
            // 验证支付令牌
            if (!verifyPaymentToken(paymentToken)) {
                log.error("支付令牌验证失败，订单ID: {}", orderId);
                throw new Exception("支付令牌验证失败");
            }
            
            // 调用Apple Pay支付处理URL
            String response = callApplePayService(paymentToken, amount, currency, orderId);
            
            // 解析响应
            Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
            
            log.info("Apple Pay支付处理完成，订单ID: {}", orderId);
            return responseMap;
        } catch (Exception e) {
            log.error("处理Apple Pay支付请求异常，订单ID: {}", orderId, e);
            throw new RuntimeException("处理支付请求失败: " + e.getMessage());
        }
    }
    
    /**
     * 调用Apple Pay支付服务
     * @param paymentToken 支付令牌
     * @param amount 支付金额
     * @param currency 货币代码
     * @param orderId 订单ID
     * @return 服务响应
     */
    private String callApplePayService(String paymentToken, String amount, String currency, String orderId) throws Exception {
        URL url = new URL(ApplePayConfig.getApplePayUrl());
        HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
        
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);
        
        // 构建请求体
        Map<String, Object> requestBody = Map.of(
            "paymentToken", paymentToken,
            "amount", ApplePayConfig.formatAmount(amount),
            "currency", currency,
            "orderId", orderId
        );
        
        String requestJson = objectMapper.writeValueAsString(requestBody);
        
        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = requestJson.getBytes("utf-8");
            os.write(input, 0, input.length);
        }
        
        // 读取响应
        int responseCode = connection.getResponseCode();
        if (responseCode == HttpsURLConnection.HTTP_OK) {
            try (BufferedReader br = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), "utf-8"))) {
                StringBuilder response = new StringBuilder();
                String responseLine = null;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                return response.toString();
            }
        } else {
            throw new Exception("Apple Pay服务调用失败，响应码: " + responseCode);
        }
    }
    
    /**
     * 验证签名
     * @param tokenMap 支付令牌映射
     * @return 签名是否有效
     */
    private boolean validateSignature(Map<String, Object> tokenMap) {
        try {
            // 获取签名数据
            Map<String, Object> header = (Map<String, Object>) tokenMap.get("header");
            String signature = (String) header.get("signature");
            String publicKeyHash = (String) header.get("publicKeyHash");
            String transactionId = (String) header.get("transactionId");
            
            // 获取商户证书
            KeyStore keyStore = loadMerchantCertificate();
            
            // 获取公钥
            PublicKey publicKey = getPublicKey(keyStore);
            
            // 验证签名
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(publicKey);
            
            // 构建签名数据
            String dataToSign = transactionId + publicKeyHash;
            sig.update(dataToSign.getBytes());
            
            byte[] signatureBytes = Base64.getDecoder().decode(signature);
            return sig.verify(signatureBytes);
        } catch (Exception e) {
            log.error("验证签名异常", e);
            return false;
        }
    }
    
    /**
     * 加载商户证书
     * @return KeyStore
     */
    private KeyStore loadMerchantCertificate() throws KeyStoreException, IOException, CertificateException, NoSuchAlgorithmException {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (FileInputStream fis = new FileInputStream(ApplePayConfig.CERTIFICATE_PATH)) {
            keyStore.load(fis, ApplePayConfig.CERTIFICATE_PASSWORD.toCharArray());
        }
        return keyStore;
    }
    
    /**
     * 获取公钥
     * @param keyStore KeyStore
     * @return PublicKey
     */
    private PublicKey getPublicKey(KeyStore keyStore) throws KeyStoreException {
        // 获取证书
        X509Certificate cert = (X509Certificate) keyStore.getCertificate(keyStore.aliases().nextElement());
        return cert.getPublicKey();
    }
    
    /**
     * 生成支付会话
     * @param domainName 域名
     * @param displayName 显示名称
     * @return 支付会话信息
     */
    public Map<String, Object> generatePaymentSession(String domainName, String displayName) {
        try {
            log.info("开始生成Apple Pay支付会话，域名: {}", domainName);
            
            // 构建会话数据
            Map<String, Object> sessionData = Map.of(
                "merchantIdentifier", ApplePayConfig.MERCHANT_ID,
                "domainName", domainName,
                "displayName", displayName
            );
            
            log.info("Apple Pay支付会话生成成功");
            return sessionData;
        } catch (Exception e) {
            log.error("生成Apple Pay支付会话异常", e);
            throw new RuntimeException("生成支付会话失败: " + e.getMessage());
        }
    }
}