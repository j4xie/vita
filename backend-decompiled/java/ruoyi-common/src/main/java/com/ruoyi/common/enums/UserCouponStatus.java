/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.enums;

public enum UserCouponStatus {
    USED(-1L, "\u5df2\u4f7f\u7528"),
    CANUSE(1L, "\u672a\u4f7f\u7528"),
    EXPIRE(2L, "\u5df2\u8fc7\u671f");

    private Long value;
    private String name;

    private UserCouponStatus(Long value, String name) {
        this.value = value;
        this.name = name;
    }

    public Long getValue() {
        return this.value;
    }

    public String getName() {
        return this.name;
    }
}

