/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.postmarkapp.postmark.client.data.model.message.MessageResponse
 */
package com.ruoyi.system.email;

import com.postmarkapp.postmark.client.data.model.message.MessageResponse;

public class EmailMessageResponse
extends MessageResponse {
    String code;

    public String getCode() {
        return this.code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}

