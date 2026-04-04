/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.job;

public class TaskException
extends Exception {
    private static final long serialVersionUID = 1L;
    private Code code;

    public TaskException(String msg, Code code) {
        this(msg, code, null);
    }

    public TaskException(String msg, Code code, Exception nestedEx) {
        super(msg, nestedEx);
        this.code = code;
    }

    public Code getCode() {
        return this.code;
    }

    public static enum Code {
        TASK_EXISTS,
        NO_TASK_EXISTS,
        TASK_ALREADY_STARTED,
        UNKNOWN,
        CONFIG_ERROR,
        TASK_NODE_NOT_AVAILABLE;

    }
}

