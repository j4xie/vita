/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.base;

import com.ruoyi.common.utils.MessageUtils;
import com.ruoyi.common.utils.StringUtils;

public class BaseException
extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private String module;
    private String code;
    private Object[] args;
    private String defaultMessage;

    public BaseException(String module, String code, Object[] args, String defaultMessage) {
        this.module = module;
        this.code = code;
        this.args = args;
        this.defaultMessage = defaultMessage;
    }

    public BaseException(String module, String code, Object[] args) {
        this(module, code, args, null);
    }

    public BaseException(String module, String defaultMessage) {
        this(module, null, null, defaultMessage);
    }

    public BaseException(String code, Object[] args) {
        this(null, code, args, null);
    }

    public BaseException(String defaultMessage) {
        this(null, null, null, defaultMessage);
    }

    @Override
    public String getMessage() {
        String message = null;
        if (!StringUtils.isEmpty(this.code)) {
            message = MessageUtils.message(this.code, this.args);
        }
        if (message == null) {
            message = this.defaultMessage;
        }
        return message;
    }

    public String getModule() {
        return this.module;
    }

    public String getCode() {
        return this.code;
    }

    public Object[] getArgs() {
        return this.args;
    }

    public String getDefaultMessage() {
        return this.defaultMessage;
    }
}

