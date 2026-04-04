/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.exception.file;

import com.ruoyi.common.exception.file.FileUploadException;
import java.util.Arrays;

public class InvalidExtensionException
extends FileUploadException {
    private static final long serialVersionUID = 1L;
    private String[] allowedExtension;
    private String extension;
    private String filename;

    public InvalidExtensionException(String[] allowedExtension, String extension, String filename) {
        super("\u6587\u4ef6[" + filename + "]\u540e\u7f00[" + extension + "]\u4e0d\u6b63\u786e\uff0c\u8bf7\u4e0a\u4f20" + Arrays.toString(allowedExtension) + "\u683c\u5f0f");
        this.allowedExtension = allowedExtension;
        this.extension = extension;
        this.filename = filename;
    }

    public String[] getAllowedExtension() {
        return this.allowedExtension;
    }

    public String getExtension() {
        return this.extension;
    }

    public String getFilename() {
        return this.filename;
    }

    public static class InvalidVideoExtensionException
    extends InvalidExtensionException {
        private static final long serialVersionUID = 1L;

        public InvalidVideoExtensionException(String[] allowedExtension, String extension, String filename) {
            super(allowedExtension, extension, filename);
        }
    }

    public static class InvalidMediaExtensionException
    extends InvalidExtensionException {
        private static final long serialVersionUID = 1L;

        public InvalidMediaExtensionException(String[] allowedExtension, String extension, String filename) {
            super(allowedExtension, extension, filename);
        }
    }

    public static class InvalidFlashExtensionException
    extends InvalidExtensionException {
        private static final long serialVersionUID = 1L;

        public InvalidFlashExtensionException(String[] allowedExtension, String extension, String filename) {
            super(allowedExtension, extension, filename);
        }
    }

    public static class InvalidImageExtensionException
    extends InvalidExtensionException {
        private static final long serialVersionUID = 1L;

        public InvalidImageExtensionException(String[] allowedExtension, String extension, String filename) {
            super(allowedExtension, extension, filename);
        }
    }
}

