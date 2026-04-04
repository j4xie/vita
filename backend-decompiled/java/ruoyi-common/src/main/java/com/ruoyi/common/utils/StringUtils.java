/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.commons.lang3.StringUtils
 *  org.springframework.util.AntPathMatcher
 */
package com.ruoyi.common.utils;

import com.ruoyi.common.core.text.StrFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.util.AntPathMatcher;

public class StringUtils
extends org.apache.commons.lang3.StringUtils {
    private static final String NULLSTR = "";
    private static final char SEPARATOR = '_';
    private static final char ASTERISK = '*';

    public static <T> T nvl(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }

    public static boolean isEmpty(Collection<?> coll) {
        return StringUtils.isNull(coll) || coll.isEmpty();
    }

    public static boolean isNotEmpty(Collection<?> coll) {
        return !StringUtils.isEmpty(coll);
    }

    public static boolean isEmpty(Object[] objects) {
        return StringUtils.isNull(objects) || objects.length == 0;
    }

    public static boolean isNotEmpty(Object[] objects) {
        return !StringUtils.isEmpty(objects);
    }

    public static boolean isEmpty(Map<?, ?> map) {
        return StringUtils.isNull(map) || map.isEmpty();
    }

    public static boolean isNotEmpty(Map<?, ?> map) {
        return !StringUtils.isEmpty(map);
    }

    public static boolean isEmpty(String str) {
        return StringUtils.isNull(str) || NULLSTR.equals(str.trim());
    }

    public static boolean isNotEmpty(String str) {
        return !StringUtils.isEmpty(str);
    }

    public static boolean isNull(Object object) {
        return object == null;
    }

    public static boolean isNotNull(Object object) {
        return !StringUtils.isNull(object);
    }

    public static boolean isArray(Object object) {
        return StringUtils.isNotNull(object) && object.getClass().isArray();
    }

    public static String trim(String str) {
        return str == null ? NULLSTR : str.trim();
    }

    public static String hide(CharSequence str, int startInclude, int endExclude) {
        if (StringUtils.isEmpty((CharSequence)str)) {
            return NULLSTR;
        }
        int strLength = str.length();
        if (startInclude > strLength) {
            return NULLSTR;
        }
        if (endExclude > strLength) {
            endExclude = strLength;
        }
        if (startInclude > endExclude) {
            return NULLSTR;
        }
        char[] chars = new char[strLength];
        for (int i = 0; i < strLength; ++i) {
            chars[i] = i >= startInclude && i < endExclude ? 42 : str.charAt(i);
        }
        return new String(chars);
    }

    public static String substring(String str, int start) {
        if (str == null) {
            return NULLSTR;
        }
        if (start < 0) {
            start = str.length() + start;
        }
        if (start < 0) {
            start = 0;
        }
        if (start > str.length()) {
            return NULLSTR;
        }
        return str.substring(start);
    }

    public static String substring(String str, int start, int end) {
        if (str == null) {
            return NULLSTR;
        }
        if (end < 0) {
            end = str.length() + end;
        }
        if (start < 0) {
            start = str.length() + start;
        }
        if (end > str.length()) {
            end = str.length();
        }
        if (start > end) {
            return NULLSTR;
        }
        if (start < 0) {
            start = 0;
        }
        if (end < 0) {
            end = 0;
        }
        return str.substring(start, end);
    }

    public static String substringBetweenLast(String str, String open, String close) {
        int end;
        if (StringUtils.isEmpty(str) || StringUtils.isEmpty(open) || StringUtils.isEmpty(close)) {
            return NULLSTR;
        }
        int start = str.indexOf(open);
        if (start != -1 && (end = str.lastIndexOf(close)) != -1) {
            return str.substring(start + open.length(), end);
        }
        return NULLSTR;
    }

    public static boolean hasText(String str) {
        return str != null && !str.isEmpty() && StringUtils.containsText(str);
    }

    private static boolean containsText(CharSequence str) {
        int strLen = str.length();
        for (int i = 0; i < strLen; ++i) {
            if (Character.isWhitespace(str.charAt(i))) continue;
            return true;
        }
        return false;
    }

    public static String format(String template, Object ... params) {
        if (StringUtils.isEmpty(params) || StringUtils.isEmpty(template)) {
            return template;
        }
        return StrFormatter.format(template, params);
    }

    public static boolean ishttp(String link) {
        return StringUtils.startsWithAny((CharSequence)link, (CharSequence[])new CharSequence[]{"http://", "https://"});
    }

    public static final Set<String> str2Set(String str, String sep) {
        return new HashSet<String>(StringUtils.str2List(str, sep, true, false));
    }

    public static final List<String> str2List(String str, String sep) {
        return StringUtils.str2List(str, sep, true, false);
    }

    public static final List<String> str2List(String str, String sep, boolean filterBlank, boolean trim) {
        String[] split;
        ArrayList<String> list = new ArrayList<String>();
        if (StringUtils.isEmpty(str)) {
            return list;
        }
        if (filterBlank && StringUtils.isBlank((CharSequence)str)) {
            return list;
        }
        for (String string : split = str.split(sep)) {
            if (filterBlank && StringUtils.isBlank((CharSequence)string)) continue;
            if (trim) {
                string = string.trim();
            }
            list.add(string);
        }
        return list;
    }

    public static boolean containsAny(Collection<String> collection, String ... array) {
        if (StringUtils.isEmpty(collection) || StringUtils.isEmpty(array)) {
            return false;
        }
        for (String str : array) {
            if (!collection.contains(str)) continue;
            return true;
        }
        return false;
    }

    public static boolean containsAnyIgnoreCase(CharSequence cs, CharSequence ... searchCharSequences) {
        if (StringUtils.isEmpty((CharSequence)cs) || StringUtils.isEmpty(searchCharSequences)) {
            return false;
        }
        for (CharSequence testStr : searchCharSequences) {
            if (!StringUtils.containsIgnoreCase((CharSequence)cs, (CharSequence)testStr)) continue;
            return true;
        }
        return false;
    }

    public static String toUnderScoreCase(String str) {
        if (str == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        boolean preCharIsUpperCase = true;
        boolean curreCharIsUpperCase = true;
        boolean nexteCharIsUpperCase = true;
        for (int i = 0; i < str.length(); ++i) {
            char c = str.charAt(i);
            preCharIsUpperCase = i > 0 ? Character.isUpperCase(str.charAt(i - 1)) : false;
            curreCharIsUpperCase = Character.isUpperCase(c);
            if (i < str.length() - 1) {
                nexteCharIsUpperCase = Character.isUpperCase(str.charAt(i + 1));
            }
            if (preCharIsUpperCase && curreCharIsUpperCase && !nexteCharIsUpperCase) {
                sb.append('_');
            } else if (i != 0 && !preCharIsUpperCase && curreCharIsUpperCase) {
                sb.append('_');
            }
            sb.append(Character.toLowerCase(c));
        }
        return sb.toString();
    }

    public static boolean inStringIgnoreCase(String str, String ... strs) {
        if (str != null && strs != null) {
            for (String s : strs) {
                if (!str.equalsIgnoreCase(StringUtils.trim(s))) continue;
                return true;
            }
        }
        return false;
    }

    public static String convertToCamelCase(String name) {
        String[] camels;
        StringBuilder result = new StringBuilder();
        if (name == null || name.isEmpty()) {
            return NULLSTR;
        }
        if (!name.contains("_")) {
            return name.substring(0, 1).toUpperCase() + name.substring(1);
        }
        for (String camel : camels = name.split("_")) {
            if (camel.isEmpty()) continue;
            result.append(camel.substring(0, 1).toUpperCase());
            result.append(camel.substring(1).toLowerCase());
        }
        return result.toString();
    }

    public static String toCamelCase(String s) {
        if (s == null) {
            return null;
        }
        if (s.indexOf(95) == -1) {
            return s;
        }
        s = s.toLowerCase();
        StringBuilder sb = new StringBuilder(s.length());
        boolean upperCase = false;
        for (int i = 0; i < s.length(); ++i) {
            char c = s.charAt(i);
            if (c == '_') {
                upperCase = true;
                continue;
            }
            if (upperCase) {
                sb.append(Character.toUpperCase(c));
                upperCase = false;
                continue;
            }
            sb.append(c);
        }
        return sb.toString();
    }

    public static boolean matches(String str, List<String> strs) {
        if (StringUtils.isEmpty(str) || StringUtils.isEmpty(strs)) {
            return false;
        }
        for (String pattern : strs) {
            if (!StringUtils.isMatch(pattern, str)) continue;
            return true;
        }
        return false;
    }

    public static boolean isMatch(String pattern, String url) {
        AntPathMatcher matcher = new AntPathMatcher();
        return matcher.match(pattern, url);
    }

    public static <T> T cast(Object obj) {
        return (T)obj;
    }

    public static final String padl(Number num, int size) {
        return StringUtils.padl(num.toString(), size, '0');
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    public static final String padl(String s, int size, char c) {
        StringBuilder sb = new StringBuilder(size);
        if (s != null) {
            int len = s.length();
            if (s.length() > size) return s.substring(len - size, len);
            for (int i = size - len; i > 0; --i) {
                sb.append(c);
            }
            sb.append(s);
            return sb.toString();
        } else {
            for (int i = size; i > 0; --i) {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}

