package com.ruoyi.common.enums;

public enum RoleKey {

    admin("admin"),//超级管理员
    manage("manage"),//总管理员
    part_manage("part_manage"),//分管理员
    staff("staff"),//内部人员
    common("common"),//普通用户
    merchant("merchant"); //商家

    private String value;

    RoleKey(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
