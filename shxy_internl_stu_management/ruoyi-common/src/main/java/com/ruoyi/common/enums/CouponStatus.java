package com.ruoyi.common.enums;

public enum CouponStatus {

    AUDIT(-1L, "待审核"),
    AUDIT_PASS(1L, "审核通过"),
    AUDIT_REFUDE(2L, "审核拒绝"),
    OUT_DATE(3L, "已过期");

    private Long value;
    private String name;

    CouponStatus(Long value, String name) {
        this.value = value;
        this.name = name;
    }

    public Long getValue() {
        return value;
    }

    public String getName() {
        return name;
    }

}
