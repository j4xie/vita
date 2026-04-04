/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.user;

import com.ruoyi.common.exception.user.UserException;

public class CaptchaExpireException
extends UserException {
    private static final long serialVersionUID = 1L;

    public CaptchaExpireException() {
        super("user.jcaptcha.expire", (Object[])null);
    }
}

