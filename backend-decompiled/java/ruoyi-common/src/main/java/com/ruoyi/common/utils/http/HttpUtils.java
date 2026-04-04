/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils.http;

import com.ruoyi.common.utils.StringUtils;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpUtils {
    private static final Logger log = LoggerFactory.getLogger(HttpUtils.class);

    public static String sendGet(String url) {
        return HttpUtils.sendGet(url, "");
    }

    public static String sendGet(String url, String param) {
        return HttpUtils.sendGet(url, param, "UTF-8");
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static String sendGet(String url, String param, String contentType) {
        StringBuilder result = new StringBuilder();
        BufferedReader in = null;
        try {
            String line;
            String urlNameString = StringUtils.isNotBlank((CharSequence)param) ? url + "?" + param : url;
            log.info("sendGet - {}", (Object)urlNameString);
            URL realUrl = new URL(urlNameString);
            URLConnection connection = realUrl.openConnection();
            connection.setRequestProperty("accept", "*/*");
            connection.setRequestProperty("connection", "Keep-Alive");
            connection.setRequestProperty("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            connection.connect();
            in = new BufferedReader(new InputStreamReader(connection.getInputStream(), contentType));
            while ((line = in.readLine()) != null) {
                result.append(line);
            }
            log.info("recv - {}", (Object)result);
        }
        catch (ConnectException e) {
            log.error("\u8c03\u7528HttpUtils.sendGet ConnectException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (SocketTimeoutException e) {
            log.error("\u8c03\u7528HttpUtils.sendGet SocketTimeoutException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (IOException e) {
            log.error("\u8c03\u7528HttpUtils.sendGet IOException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (Exception e) {
            log.error("\u8c03\u7528HttpsUtil.sendGet Exception, url=" + url + ",param=" + param, (Throwable)e);
        }
        finally {
            try {
                if (in != null) {
                    in.close();
                }
            }
            catch (Exception ex) {
                log.error("\u8c03\u7528in.close Exception, url=" + url + ",param=" + param, (Throwable)ex);
            }
        }
        return result.toString();
    }

    public static String sendPost(String url, String param) {
        return HttpUtils.sendPost(url, param, "application/x-www-form-urlencoded");
    }

    /*
     * WARNING - Removed try catching itself - possible behaviour change.
     */
    public static String sendPost(String url, String param, String contentType) {
        PrintWriter out = null;
        BufferedReader in = null;
        StringBuilder result = new StringBuilder();
        try {
            String line;
            log.info("sendPost - {}", (Object)url);
            URL realUrl = new URL(url);
            URLConnection conn = realUrl.openConnection();
            conn.setRequestProperty("accept", "*/*");
            conn.setRequestProperty("connection", "Keep-Alive");
            conn.setRequestProperty("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            conn.setRequestProperty("Accept-Charset", "utf-8");
            conn.setRequestProperty("Content-Type", contentType);
            conn.setDoOutput(true);
            conn.setDoInput(true);
            out = new PrintWriter(conn.getOutputStream());
            out.print(param);
            out.flush();
            in = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            while ((line = in.readLine()) != null) {
                result.append(line);
            }
            log.info("recv - {}", (Object)result);
        }
        catch (ConnectException e) {
            log.error("\u8c03\u7528HttpUtils.sendPost ConnectException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (SocketTimeoutException e) {
            log.error("\u8c03\u7528HttpUtils.sendPost SocketTimeoutException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (IOException e) {
            log.error("\u8c03\u7528HttpUtils.sendPost IOException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (Exception e) {
            log.error("\u8c03\u7528HttpsUtil.sendPost Exception, url=" + url + ",param=" + param, (Throwable)e);
        }
        finally {
            try {
                if (out != null) {
                    out.close();
                }
                if (in != null) {
                    in.close();
                }
            }
            catch (IOException ex) {
                log.error("\u8c03\u7528in.close Exception, url=" + url + ",param=" + param, (Throwable)ex);
            }
        }
        return result.toString();
    }

    public static String sendSSLPost(String url, String param) {
        return HttpUtils.sendSSLPost(url, param, "application/x-www-form-urlencoded");
    }

    public static String sendSSLPost(String url, String param, String contentType) {
        StringBuilder result = new StringBuilder();
        String urlNameString = url + "?" + param;
        try {
            log.info("sendSSLPost - {}", (Object)urlNameString);
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, new TrustManager[]{new TrustAnyTrustManager()}, new SecureRandom());
            URL console = new URL(urlNameString);
            HttpsURLConnection conn = (HttpsURLConnection)console.openConnection();
            conn.setRequestProperty("accept", "*/*");
            conn.setRequestProperty("connection", "Keep-Alive");
            conn.setRequestProperty("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            conn.setRequestProperty("Accept-Charset", "utf-8");
            conn.setRequestProperty("Content-Type", contentType);
            conn.setDoOutput(true);
            conn.setDoInput(true);
            conn.setSSLSocketFactory(sc.getSocketFactory());
            conn.setHostnameVerifier(new TrustAnyHostnameVerifier());
            conn.connect();
            InputStream is = conn.getInputStream();
            BufferedReader br = new BufferedReader(new InputStreamReader(is));
            String ret = "";
            while ((ret = br.readLine()) != null) {
                if (ret == null || "".equals(ret.trim())) continue;
                result.append(new String(ret.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8));
            }
            log.info("recv - {}", (Object)result);
            conn.disconnect();
            br.close();
        }
        catch (ConnectException e) {
            log.error("\u8c03\u7528HttpUtils.sendSSLPost ConnectException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (SocketTimeoutException e) {
            log.error("\u8c03\u7528HttpUtils.sendSSLPost SocketTimeoutException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (IOException e) {
            log.error("\u8c03\u7528HttpUtils.sendSSLPost IOException, url=" + url + ",param=" + param, (Throwable)e);
        }
        catch (Exception e) {
            log.error("\u8c03\u7528HttpsUtil.sendSSLPost Exception, url=" + url + ",param=" + param, (Throwable)e);
        }
        return result.toString();
    }

    private static class TrustAnyTrustManager
    implements X509TrustManager {
        private TrustAnyTrustManager() {
        }

        @Override
        public void checkClientTrusted(X509Certificate[] chain, String authType) {
        }

        @Override
        public void checkServerTrusted(X509Certificate[] chain, String authType) {
        }

        @Override
        public X509Certificate[] getAcceptedIssuers() {
            return new X509Certificate[0];
        }
    }

    private static class TrustAnyHostnameVerifier
    implements HostnameVerifier {
        private TrustAnyHostnameVerifier() {
        }

        @Override
        public boolean verify(String hostname, SSLSession session) {
            return true;
        }
    }
}

