/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.file;

import com.ruoyi.common.exception.file.FileException;

public class FileSizeLimitExceededException
extends FileException {
    private static final long serialVersionUID = 1L;

    public FileSizeLimitExceededException(long defaultMaxSize) {
        super("upload.exceed.maxSize", new Object[]{defaultMaxSize});
    }
}

