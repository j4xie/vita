/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.boot.context.properties.ConfigurationProperties
 *  org.springframework.stereotype.Component
 */
package com.ruoyi.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix="ruoyi")
public class RuoYiConfig {
    private String name;
    private String version;
    private String copyrightYear;
    private static String profile;
    private static boolean addressEnabled;
    private static String captchaType;

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVersion() {
        return this.version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getCopyrightYear() {
        return this.copyrightYear;
    }

    public void setCopyrightYear(String copyrightYear) {
        this.copyrightYear = copyrightYear;
    }

    public static String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        RuoYiConfig.profile = profile;
    }

    public static boolean isAddressEnabled() {
        return addressEnabled;
    }

    public void setAddressEnabled(boolean addressEnabled) {
        RuoYiConfig.addressEnabled = addressEnabled;
    }

    public static String getCaptchaType() {
        return captchaType;
    }

    public void setCaptchaType(String captchaType) {
        RuoYiConfig.captchaType = captchaType;
    }

    public static String getImportPath() {
        return RuoYiConfig.getProfile() + "/import";
    }

    public static String getAvatarPath() {
        return RuoYiConfig.getProfile() + "/avatar";
    }

    public static String getDownloadPath() {
        return RuoYiConfig.getProfile() + "/download/";
    }

    public static String getUploadPath() {
        return RuoYiConfig.getProfile() + "/upload";
    }
}

