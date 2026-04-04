/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.beans.BeanUtils
 */
package com.ruoyi.common.utils.bean;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BeanUtils
extends org.springframework.beans.BeanUtils {
    private static final int BEAN_METHOD_PROP_INDEX = 3;
    private static final Pattern GET_PATTERN = Pattern.compile("get(\\p{javaUpperCase}\\w*)");
    private static final Pattern SET_PATTERN = Pattern.compile("set(\\p{javaUpperCase}\\w*)");

    public static void copyBeanProp(Object dest, Object src) {
        try {
            BeanUtils.copyProperties((Object)src, (Object)dest);
        }
        catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static List<Method> getSetterMethods(Object obj) {
        Method[] methods;
        ArrayList<Method> setterMethods = new ArrayList<Method>();
        for (Method method : methods = obj.getClass().getMethods()) {
            Matcher m = SET_PATTERN.matcher(method.getName());
            if (!m.matches() || method.getParameterTypes().length != 1) continue;
            setterMethods.add(method);
        }
        return setterMethods;
    }

    public static List<Method> getGetterMethods(Object obj) {
        Method[] methods;
        ArrayList<Method> getterMethods = new ArrayList<Method>();
        for (Method method : methods = obj.getClass().getMethods()) {
            Matcher m = GET_PATTERN.matcher(method.getName());
            if (!m.matches() || method.getParameterTypes().length != 0) continue;
            getterMethods.add(method);
        }
        return getterMethods;
    }

    public static boolean isMethodPropEquals(String m1, String m2) {
        return m1.substring(3).equals(m2.substring(3));
    }
}

