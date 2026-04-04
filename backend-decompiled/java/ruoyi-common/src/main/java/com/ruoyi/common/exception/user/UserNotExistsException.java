/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.user;

import com.ruoyi.common.exception.user.UserException;

public class UserNotExistsException
extends UserException {
    private static final long serialVersionUID = 1L;

    public UserNotExistsException() {
        super("user.not.exists", (Object[])null);
    }
}

