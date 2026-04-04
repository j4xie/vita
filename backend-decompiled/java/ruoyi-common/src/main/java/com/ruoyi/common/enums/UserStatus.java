/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.enums;

public enum UserStatus {
    OK("0", "\u6b63\u5e38"),
    DISABLE("1", "\u505c\u7528"),
    DELETED("2", "\u5220\u9664");

    private final String code;
    private final String info;

    private UserStatus(String code, String info) {
        this.code = code;
        this.info = info;
    }

    public String getCode() {
        return this.code;
    }

    public String getInfo() {
        return this.info;
    }
}

