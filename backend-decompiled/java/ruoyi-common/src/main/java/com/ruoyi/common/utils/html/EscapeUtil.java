/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.utils.html;

import com.ruoyi.common.utils.StringUtils;
import com.ruoyi.common.utils.html.HTMLFilter;

public class EscapeUtil {
    public static final String RE_HTML_MARK = "(<[^<]*?>)|(<[\\s]*?/[^<]*?>)|(<[^<]*?/[\\s]*?>)";
    private static final char[][] TEXT = new char[64][];

    public static String escape(String text) {
        return EscapeUtil.encode(text);
    }

    public static String unescape(String content) {
        return EscapeUtil.decode(content);
    }

    public static String clean(String content) {
        return new HTMLFilter().filter(content);
    }

    private static String encode(String text) {
        if (StringUtils.isEmpty(text)) {
            return "";
        }
        StringBuilder tmp = new StringBuilder(text.length() * 6);
        for (int i = 0; i < text.length(); ++i) {
            char c = text.charAt(i);
            if (c < '\u0100') {
                tmp.append("%");
                if (c < '\u0010') {
                    tmp.append("0");
                }
                tmp.append(Integer.toString(c, 16));
                continue;
            }
            tmp.append("%u");
            if (c <= '\u0fff') {
                tmp.append("0");
            }
            tmp.append(Integer.toString(c, 16));
        }
        return tmp.toString();
    }

    public static String decode(String content) {
        if (StringUtils.isEmpty(content)) {
            return content;
        }
        StringBuilder tmp = new StringBuilder(content.length());
        int lastPos = 0;
        int pos = 0;
        while (lastPos < content.length()) {
            pos = content.indexOf("%", lastPos);
            if (pos == lastPos) {
                char ch;
                if (content.charAt(pos + 1) == 'u') {
                    ch = (char)Integer.parseInt(content.substring(pos + 2, pos + 6), 16);
                    tmp.append(ch);
                    lastPos = pos + 6;
                    continue;
                }
                ch = (char)Integer.parseInt(content.substring(pos + 1, pos + 3), 16);
                tmp.append(ch);
                lastPos = pos + 3;
                continue;
            }
            if (pos == -1) {
                tmp.append(content.substring(lastPos));
                lastPos = content.length();
                continue;
            }
            tmp.append(content.substring(lastPos, pos));
            lastPos = pos;
        }
        return tmp.toString();
    }

    public static void main(String[] args) {
        String html = "<script>alert(1);</script>";
        String escape = EscapeUtil.escape(html);
        System.out.println("clean: " + EscapeUtil.clean(html));
        System.out.println("escape: " + escape);
        System.out.println("unescape: " + EscapeUtil.unescape(escape));
    }

    static {
        for (int i = 0; i < 64; ++i) {
            EscapeUtil.TEXT[i] = new char[]{(char)i};
        }
        EscapeUtil.TEXT[39] = "&#039;".toCharArray();
        EscapeUtil.TEXT[34] = "&#34;".toCharArray();
        EscapeUtil.TEXT[38] = "&#38;".toCharArray();
        EscapeUtil.TEXT[60] = "&#60;".toCharArray();
        EscapeUtil.TEXT[62] = "&#62;".toCharArray();
    }
}

