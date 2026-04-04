/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.servlet.http.HttpServletRequest
 *  javax.servlet.http.HttpServletResponse
 *  org.apache.commons.io.FilenameUtils
 *  org.apache.commons.io.IOUtils
 *  org.apache.commons.lang3.ArrayUtils
 */
package com.ruoyi.common.utils.file;

import com.ruoyi.common.config.RuoYiConfig;
import com.ruoyi.common.utils.DateUtils;
import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.file.FileTypeUtils;
import com.ruoyi.common.utils.file.FileUploadUtils;
import com.ruoyi.common.utils.file.MimeTypeUtils;
import com.ruoyi.common.utils.uuid.IdUtils;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.ArrayUtils;

public class FileUtils {
    public static String FILENAME_PATTERN = "[a-zA-Z0-9_\\-\\|\\.\\u4e00-\\u9fa5]+";

    public static void writeBytes(String filePath, OutputStream os) throws IOException {
        FileInputStream fis = null;
        try {
            int length;
            File file = new File(filePath);
            if (!file.exists()) {
                throw new FileNotFoundException(filePath);
            }
            fis = new FileInputStream(file);
            byte[] b = new byte[1024];
            while ((length = fis.read(b)) > 0) {
                os.write(b, 0, length);
            }
        }
        catch (IOException e) {
            try {
                throw e;
            }
            catch (Throwable throwable) {
                IOUtils.close((Closeable)os);
                IOUtils.close(fis);
                throw throwable;
            }
        }
        IOUtils.close((Closeable)os);
        IOUtils.close((Closeable)fis);
    }

    public static String writeImportBytes(byte[] data) throws IOException {
        return FileUtils.writeBytes(data, RuoYiConfig.getImportPath());
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static String writeBytes(byte[] data, String uploadDir) throws IOException {
        FileOutputStream fos = null;
        Object pathName = "";
        try {
            String extension = FileUtils.getFileExtendName(data);
            pathName = DateUtils.datePath() + "/" + IdUtils.fastUUID() + "." + extension;
            File file = FileUploadUtils.getAbsoluteFile(uploadDir, (String)pathName);
            fos = new FileOutputStream(file);
            fos.write(data);
        }
        catch (Throwable throwable) {
            IOUtils.close(fos);
            throw throwable;
        }
        IOUtils.close((Closeable)fos);
        return FileUploadUtils.getPathFileName(uploadDir, (String)pathName);
    }

    public static String stripPrefix(String filePath) {
        return StringUtils.substringAfter((String)filePath, (String)"/profile");
    }

    public static boolean deleteFile(String filePath) {
        boolean flag = false;
        File file = new File(filePath);
        if (file.isFile() && file.exists()) {
            flag = file.delete();
        }
        return flag;
    }

    public static boolean isValidFilename(String filename) {
        return filename.matches(FILENAME_PATTERN);
    }

    public static boolean checkAllowDownload(String resource) {
        if (StringUtils.contains((CharSequence)resource, (CharSequence)"..")) {
            return false;
        }
        return ArrayUtils.contains((Object[])MimeTypeUtils.DEFAULT_ALLOWED_EXTENSION, (Object)FileTypeUtils.getFileType(resource));
    }

    public static String setFileDownloadHeader(HttpServletRequest request, String fileName) throws UnsupportedEncodingException {
        String agent = request.getHeader("USER-AGENT");
        String filename = fileName;
        if (agent.contains("MSIE")) {
            filename = URLEncoder.encode(filename, "utf-8");
            filename = filename.replace("+", " ");
        } else {
            filename = agent.contains("Firefox") ? new String(fileName.getBytes(), "ISO8859-1") : (agent.contains("Chrome") ? URLEncoder.encode(filename, "utf-8") : URLEncoder.encode(filename, "utf-8"));
        }
        return filename;
    }

    public static void setAttachmentResponseHeader(HttpServletResponse response, String realFileName) throws UnsupportedEncodingException {
        String percentEncodedFileName = FileUtils.percentEncode(realFileName);
        StringBuilder contentDispositionValue = new StringBuilder();
        contentDispositionValue.append("attachment; filename=").append(percentEncodedFileName).append(";").append("filename*=").append("utf-8''").append(percentEncodedFileName);
        response.addHeader("Access-Control-Expose-Headers", "Content-Disposition,download-filename");
        response.setHeader("Content-disposition", contentDispositionValue.toString());
        response.setHeader("download-filename", percentEncodedFileName);
    }

    public static String percentEncode(String s) throws UnsupportedEncodingException {
        String encode = URLEncoder.encode(s, StandardCharsets.UTF_8.toString());
        return encode.replaceAll("\\+", "%20");
    }

    public static String getFileExtendName(byte[] photoByte) {
        String strFileExtendName = "jpg";
        if (photoByte[0] == 71 && photoByte[1] == 73 && photoByte[2] == 70 && photoByte[3] == 56 && (photoByte[4] == 55 || photoByte[4] == 57) && photoByte[5] == 97) {
            strFileExtendName = "gif";
        } else if (photoByte[6] == 74 && photoByte[7] == 70 && photoByte[8] == 73 && photoByte[9] == 70) {
            strFileExtendName = "jpg";
        } else if (photoByte[0] == 66 && photoByte[1] == 77) {
            strFileExtendName = "bmp";
        } else if (photoByte[1] == 80 && photoByte[2] == 78 && photoByte[3] == 71) {
            strFileExtendName = "png";
        }
        return strFileExtendName;
    }

    public static String getName(String fileName) {
        if (fileName == null) {
            return null;
        }
        int lastUnixPos = fileName.lastIndexOf(47);
        int lastWindowsPos = fileName.lastIndexOf(92);
        int index = Math.max(lastUnixPos, lastWindowsPos);
        return fileName.substring(index + 1);
    }

    public static String getNameNotSuffix(String fileName) {
        if (fileName == null) {
            return null;
        }
        String baseName = FilenameUtils.getBaseName((String)fileName);
        return baseName;
    }
}

