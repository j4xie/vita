/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.enums;

public enum CouponType {
    DAI_JIN_QUAN(1L, "\u4ee3\u91d1\u5238");

    private Long code;
    private String label;

    private CouponType(Long code, String label) {
        this.code = code;
        this.label = label;
    }

    public Long getCode() {
        return this.code;
    }

    public String getLabel() {
        return this.label;
    }
}

