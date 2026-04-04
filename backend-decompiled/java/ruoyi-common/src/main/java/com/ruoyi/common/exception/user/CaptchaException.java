/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.user;

import com.ruoyi.common.exception.user.UserException;

public class CaptchaException
extends UserException {
    private static final long serialVersionUID = 1L;

    public CaptchaException() {
        super("user.jcaptcha.error", (Object[])null);
    }
}

