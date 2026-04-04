/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.user;

import com.ruoyi.common.exception.user.UserException;

public class UserPasswordErrorException
extends UserException {
    private static final long serialVersionUID = 1L;

    public UserPasswordErrorException() {
        super("user.password.error", (Object[])null);
    }
}

