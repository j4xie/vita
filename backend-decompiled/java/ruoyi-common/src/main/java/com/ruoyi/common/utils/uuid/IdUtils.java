/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.utils.uuid;

import com.ruoyi.common.utils.uuid.UUID;

public class IdUtils {
    public static String randomUUID() {
        return UUID.randomUUID().toString();
    }

    public static String simpleUUID() {
        return UUID.randomUUID().toString(true);
    }

    public static String fastUUID() {
        return UUID.fastUUID().toString();
    }

    public static String fastSimpleUUID() {
        return UUID.fastUUID().toString(true);
    }
}

