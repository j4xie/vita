package com.ruoyi.system.email;

import com.postmarkapp.postmark.client.data.model.message.MessageResponse;

public class EmailMessageResponse extends MessageResponse {

    String code;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
