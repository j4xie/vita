/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  io.swagger.annotations.ApiModel
 *  io.swagger.annotations.ApiModelProperty
 */
package com.ruoyi.web.controller.tool;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;

@ApiModel(value="UserEntity", description="\u7528\u6237\u5b9e\u4f53")
class UserEntity {
    @ApiModelProperty(value="\u7528\u6237ID")
    private Integer userId;
    @ApiModelProperty(value="\u7528\u6237\u540d\u79f0")
    private String username;
    @ApiModelProperty(value="\u7528\u6237\u5bc6\u7801")
    private String password;
    @ApiModelProperty(value="\u7528\u6237\u624b\u673a")
    private String mobile;

    public UserEntity() {
    }

    public UserEntity(Integer userId, String username, String password, String mobile) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.mobile = mobile;
    }

    public Integer getUserId() {
        return this.userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return this.username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getMobile() {
        return this.mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
}
