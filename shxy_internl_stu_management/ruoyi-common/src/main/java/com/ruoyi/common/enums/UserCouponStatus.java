package com.ruoyi.common.enums;

/**
 * 已发放的优惠券状态
 */
public enum UserCouponStatus {

    USED(-1L, "已使用"),//已使用
    CANUSE(1L, "未使用"),//未使用
    EXPIRE(2L, "已过期");//已过期

    private Long value;
    private String name;

    UserCouponStatus(Long value, String name) {
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
