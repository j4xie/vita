/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.utils;

import com.ruoyi.common.utils.StringUtils;

public class DesensitizedUtil {
    public static String password(String password) {
        if (StringUtils.isBlank((CharSequence)password)) {
            return "";
        }
        return StringUtils.repeat((char)'*', (int)password.length());
    }

    public static String carLicense(String carLicense) {
        if (StringUtils.isBlank((CharSequence)carLicense)) {
            return "";
        }
        if (carLicense.length() == 7) {
            carLicense = StringUtils.hide(carLicense, 3, 6);
        } else if (carLicense.length() == 8) {
            carLicense = StringUtils.hide(carLicense, 3, 7);
        }
        return carLicense;
    }
}

