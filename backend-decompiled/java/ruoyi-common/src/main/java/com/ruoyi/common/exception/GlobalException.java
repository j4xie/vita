/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception;

public class GlobalException
extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private String message;
    private String detailMessage;

    public GlobalException() {
    }

    public GlobalException(String message) {
        this.message = message;
    }

    public String getDetailMessage() {
        return this.detailMessage;
    }

    public GlobalException setDetailMessage(String detailMessage) {
        this.detailMessage = detailMessage;
        return this;
    }

    @Override
    public String getMessage() {
        return this.message;
    }

    public GlobalException setMessage(String message) {
        this.message = message;
        return this;
    }
}

