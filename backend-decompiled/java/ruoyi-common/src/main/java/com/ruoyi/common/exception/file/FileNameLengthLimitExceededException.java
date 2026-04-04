/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.file;

import com.ruoyi.common.exception.file.FileException;

public class FileNameLengthLimitExceededException
extends FileException {
    private static final long serialVersionUID = 1L;

    public FileNameLengthLimitExceededException(int defaultFileNameLength) {
        super("upload.filename.exceed.length", new Object[]{defaultFileNameLength});
    }
}

