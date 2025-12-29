package com.ruoyi.system.sms;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里短信服务配置类
 */
@Component
@Data
@NoArgsConstructor
@AllArgsConstructor
@ConfigurationProperties(prefix = "aliyun.sms")
public class AliyunSMSConfig {
    /**
     * 阿里云 accessKeyId（安全信息管理下面）
     */
    private String accessKeyId;

    /**
     * 阿里云 accessKeySecret（安全信息管理下面）
     */
    private String accessKeySecret;

    /**
     * 产品名称:云通信短信API产品,开发者无需替换
     */
    private String product;

    /**
     * 产品域名,开发者无需替换
     */
    private String domain;


    private String regionId;

    /**
     * 短信签名名称（国内/国际/港澳台消息-签名管理下面）
     */
    private String signName;

    /**
     * 发送日期 支持30天内记录查询，格式yyyyMMdd
     */
    private String dateFormat;

    /**
     * 服务结点
     */
    private String endpointName;

    /**
     * 通知短信模板
     */
    private String loginVerifyTemplate;

    /**
     * 验证码短信模板
     */
    private String vercodeTemplate;

    public String getAccessKeyId() {
        return accessKeyId;
    }

    public void setAccessKeyId(String accessKeyId) {
        this.accessKeyId = accessKeyId;
    }

    public String getAccessKeySecret() {
        return accessKeySecret;
    }

    public void setAccessKeySecret(String accessKeySecret) {
        this.accessKeySecret = accessKeySecret;
    }

    public String getProduct() {
        return product;
    }

    public void setProduct(String product) {
        this.product = product;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getRegionId() {
        return regionId;
    }

    public void setRegionId(String regionId) {
        this.regionId = regionId;
    }

    public String getSignName() {
        return signName;
    }

    public void setSignName(String signName) {
        this.signName = signName;
    }

    public String getDateFormat() {
        return dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getEndpointName() {
        return endpointName;
    }

    public void setEndpointName(String endpointName) {
        this.endpointName = endpointName;
    }

    public String getLoginVerifyTemplate() {
        return loginVerifyTemplate;
    }

    public void setLoginVerifyTemplate(String loginVerifyTemplate) {
        this.loginVerifyTemplate = loginVerifyTemplate;
    }

    public String getVercodeTemplate() {
        return vercodeTemplate;
    }

    public void setVercodeTemplate(String vercodeTemplate) {
        this.vercodeTemplate = vercodeTemplate;
    }
}
