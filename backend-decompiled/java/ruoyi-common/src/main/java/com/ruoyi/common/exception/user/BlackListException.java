/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.user;

import com.ruoyi.common.exception.user.UserException;

public class BlackListException
extends UserException {
    private static final long serialVersionUID = 1L;

    public BlackListException() {
        super("login.blocked", (Object[])null);
    }
}

