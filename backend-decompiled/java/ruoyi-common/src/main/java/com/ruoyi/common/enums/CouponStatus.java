/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.enums;

public enum CouponStatus {
    AUDIT(-1L, "\u5f85\u5ba1\u6838"),
    AUDIT_PASS(1L, "\u5ba1\u6838\u901a\u8fc7"),
    AUDIT_REFUDE(2L, "\u5ba1\u6838\u62d2\u7edd"),
    OUT_DATE(3L, "\u5df2\u8fc7\u671f");

    private Long value;
    private String name;

    private CouponStatus(Long value, String name) {
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

