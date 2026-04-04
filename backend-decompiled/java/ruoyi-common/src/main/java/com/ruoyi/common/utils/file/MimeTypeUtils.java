/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.utils.file;

public class MimeTypeUtils {
    public static final String IMAGE_PNG = "image/png";
    public static final String IMAGE_JPG = "image/jpg";
    public static final String IMAGE_JPEG = "image/jpeg";
    public static final String IMAGE_BMP = "image/bmp";
    public static final String IMAGE_GIF = "image/gif";
    public static final String[] IMAGE_EXTENSION = new String[]{"bmp", "gif", "jpg", "jpeg", "png"};
    public static final String[] FLASH_EXTENSION = new String[]{"swf", "flv"};
    public static final String[] MEDIA_EXTENSION = new String[]{"swf", "flv", "mp3", "wav", "wma", "wmv", "mid", "avi", "mpg", "asf", "rm", "rmvb"};
    public static final String[] VIDEO_EXTENSION = new String[]{"mp4", "avi", "rmvb"};
    public static final String[] DEFAULT_ALLOWED_EXTENSION = new String[]{"bmp", "gif", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "html", "htm", "txt", "rar", "zip", "gz", "bz2", "mp4", "avi", "rmvb", "pdf"};

    public static String getExtension(String prefix) {
        switch (prefix) {
            case "image/png": {
                return "png";
            }
            case "image/jpg": {
                return "jpg";
            }
            case "image/jpeg": {
                return "jpeg";
            }
            case "image/bmp": {
                return "bmp";
            }
            case "image/gif": {
                return "gif";
            }
        }
        return "";
    }
}

