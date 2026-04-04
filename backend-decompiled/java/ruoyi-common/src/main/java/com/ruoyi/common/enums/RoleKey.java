/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.enums;

public enum RoleKey {
    admin("admin"),
    manage("manage"),
    part_manage("part_manage"),
    staff("staff"),
    common("common"),
    merchant("merchant");

    private String value;

    private RoleKey(String value) {
        this.value = value;
    }

    public String getValue() {
        return this.value;
    }
}

