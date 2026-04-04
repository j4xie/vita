/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.file;

import java.io.PrintStream;
import java.io.PrintWriter;

public class FileUploadException
extends Exception {
    private static final long serialVersionUID = 1L;
    private final Throwable cause;

    public FileUploadException() {
        this(null, null);
    }

    public FileUploadException(String msg) {
        this(msg, null);
    }

    public FileUploadException(String msg, Throwable cause) {
        super(msg);
        this.cause = cause;
    }

    @Override
    public void printStackTrace(PrintStream stream) {
        super.printStackTrace(stream);
        if (this.cause != null) {
            stream.println("Caused by:");
            this.cause.printStackTrace(stream);
        }
    }

    @Override
    public void printStackTrace(PrintWriter writer) {
        super.printStackTrace(writer);
        if (this.cause != null) {
            writer.println("Caused by:");
            this.cause.printStackTrace(writer);
        }
    }

    @Override
    public Throwable getCause() {
        return this.cause;
    }
}

