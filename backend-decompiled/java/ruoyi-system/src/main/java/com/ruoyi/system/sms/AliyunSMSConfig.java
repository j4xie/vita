/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.boot.context.properties.ConfigurationProperties
 *  org.springframework.stereotype.Component
 */
package com.ruoyi.system.sms;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix="aliyun.sms")
public class AliyunSMSConfig {
    private String accessKeyId;
    private String accessKeySecret;
    private String product;
    private String domain;
    private String regionId;
    private String signName;
    private String dateFormat;
    private String endpointName;
    private String loginVerifyTemplate;
    private String vercodeTemplate;

    public String getAccessKeyId() {
        return this.accessKeyId;
    }

    public void setAccessKeyId(String accessKeyId) {
        this.accessKeyId = accessKeyId;
    }

    public String getAccessKeySecret() {
        return this.accessKeySecret;
    }

    public void setAccessKeySecret(String accessKeySecret) {
        this.accessKeySecret = accessKeySecret;
    }

    public String getProduct() {
        return this.product;
    }

    public void setProduct(String product) {
        this.product = product;
    }

    public String getDomain() {
        return this.domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getRegionId() {
        return this.regionId;
    }

    public void setRegionId(String regionId) {
        this.regionId = regionId;
    }

    public String getSignName() {
        return this.signName;
    }

    public void setSignName(String signName) {
        this.signName = signName;
    }

    public String getDateFormat() {
        return this.dateFormat;
    }

    public void setDateFormat(String dateFormat) {
        this.dateFormat = dateFormat;
    }

    public String getEndpointName() {
        return this.endpointName;
    }

    public void setEndpointName(String endpointName) {
        this.endpointName = endpointName;
    }

    public String getLoginVerifyTemplate() {
        return this.loginVerifyTemplate;
    }

    public void setLoginVerifyTemplate(String loginVerifyTemplate) {
        this.loginVerifyTemplate = loginVerifyTemplate;
    }

    public String getVercodeTemplate() {
        return this.vercodeTemplate;
    }

    public void setVercodeTemplate(String vercodeTemplate) {
        this.vercodeTemplate = vercodeTemplate;
    }

    public boolean equals(Object o) {
        if (o == this) {
            return true;
        }
        if (!(o instanceof AliyunSMSConfig)) {
            return false;
        }
        AliyunSMSConfig other = (AliyunSMSConfig)o;
        if (!other.canEqual(this)) {
            return false;
        }
        String this$accessKeyId = this.getAccessKeyId();
        String other$accessKeyId = other.getAccessKeyId();
        if (this$accessKeyId == null ? other$accessKeyId != null : !this$accessKeyId.equals(other$accessKeyId)) {
            return false;
        }
        String this$accessKeySecret = this.getAccessKeySecret();
        String other$accessKeySecret = other.getAccessKeySecret();
        if (this$accessKeySecret == null ? other$accessKeySecret != null : !this$accessKeySecret.equals(other$accessKeySecret)) {
            return false;
        }
        String this$product = this.getProduct();
        String other$product = other.getProduct();
        if (this$product == null ? other$product != null : !this$product.equals(other$product)) {
            return false;
        }
        String this$domain = this.getDomain();
        String other$domain = other.getDomain();
        if (this$domain == null ? other$domain != null : !this$domain.equals(other$domain)) {
            return false;
        }
        String this$regionId = this.getRegionId();
        String other$regionId = other.getRegionId();
        if (this$regionId == null ? other$regionId != null : !this$regionId.equals(other$regionId)) {
            return false;
        }
        String this$signName = this.getSignName();
        String other$signName = other.getSignName();
        if (this$signName == null ? other$signName != null : !this$signName.equals(other$signName)) {
            return false;
        }
        String this$dateFormat = this.getDateFormat();
        String other$dateFormat = other.getDateFormat();
        if (this$dateFormat == null ? other$dateFormat != null : !this$dateFormat.equals(other$dateFormat)) {
            return false;
        }
        String this$endpointName = this.getEndpointName();
        String other$endpointName = other.getEndpointName();
        if (this$endpointName == null ? other$endpointName != null : !this$endpointName.equals(other$endpointName)) {
            return false;
        }
        String this$loginVerifyTemplate = this.getLoginVerifyTemplate();
        String other$loginVerifyTemplate = other.getLoginVerifyTemplate();
        if (this$loginVerifyTemplate == null ? other$loginVerifyTemplate != null : !this$loginVerifyTemplate.equals(other$loginVerifyTemplate)) {
            return false;
        }
        String this$vercodeTemplate = this.getVercodeTemplate();
        String other$vercodeTemplate = other.getVercodeTemplate();
        return !(this$vercodeTemplate == null ? other$vercodeTemplate != null : !this$vercodeTemplate.equals(other$vercodeTemplate));
    }

    protected boolean canEqual(Object other) {
        return other instanceof AliyunSMSConfig;
    }

    public int hashCode() {
        int PRIME = 59;
        int result = 1;
        String $accessKeyId = this.getAccessKeyId();
        result = result * 59 + ($accessKeyId == null ? 43 : $accessKeyId.hashCode());
        String $accessKeySecret = this.getAccessKeySecret();
        result = result * 59 + ($accessKeySecret == null ? 43 : $accessKeySecret.hashCode());
        String $product = this.getProduct();
        result = result * 59 + ($product == null ? 43 : $product.hashCode());
        String $domain = this.getDomain();
        result = result * 59 + ($domain == null ? 43 : $domain.hashCode());
        String $regionId = this.getRegionId();
        result = result * 59 + ($regionId == null ? 43 : $regionId.hashCode());
        String $signName = this.getSignName();
        result = result * 59 + ($signName == null ? 43 : $signName.hashCode());
        String $dateFormat = this.getDateFormat();
        result = result * 59 + ($dateFormat == null ? 43 : $dateFormat.hashCode());
        String $endpointName = this.getEndpointName();
        result = result * 59 + ($endpointName == null ? 43 : $endpointName.hashCode());
        String $loginVerifyTemplate = this.getLoginVerifyTemplate();
        result = result * 59 + ($loginVerifyTemplate == null ? 43 : $loginVerifyTemplate.hashCode());
        String $vercodeTemplate = this.getVercodeTemplate();
        result = result * 59 + ($vercodeTemplate == null ? 43 : $vercodeTemplate.hashCode());
        return result;
    }

    public String toString() {
        return "AliyunSMSConfig(accessKeyId=" + this.getAccessKeyId() + ", accessKeySecret=" + this.getAccessKeySecret() + ", product=" + this.getProduct() + ", domain=" + this.getDomain() + ", regionId=" + this.getRegionId() + ", signName=" + this.getSignName() + ", dateFormat=" + this.getDateFormat() + ", endpointName=" + this.getEndpointName() + ", loginVerifyTemplate=" + this.getLoginVerifyTemplate() + ", vercodeTemplate=" + this.getVercodeTemplate() + ")";
    }

    public AliyunSMSConfig() {
    }

    public AliyunSMSConfig(String accessKeyId, String accessKeySecret, String product, String domain, String regionId, String signName, String dateFormat, String endpointName, String loginVerifyTemplate, String vercodeTemplate) {
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.product = product;
        this.domain = domain;
        this.regionId = regionId;
        this.signName = signName;
        this.dateFormat = dateFormat;
        this.endpointName = endpointName;
        this.loginVerifyTemplate = loginVerifyTemplate;
        this.vercodeTemplate = vercodeTemplate;
    }
}

