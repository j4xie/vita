/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.apache.commons.lang3.StringUtils
 *  org.apache.commons.lang3.Validate
 *  org.apache.poi.ss.usermodel.DateUtil
 *  org.slf4j.Logger
 *  org.slf4j.LoggerFactory
 */
package com.ruoyi.common.utils.reflect;

import com.ruoyi.common.core.text.Convert;
import com.ruoyi.common.utils.DateUtils;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.Date;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.Validate;
import org.apache.poi.ss.usermodel.DateUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReflectUtils {
    private static final String SETTER_PREFIX = "set";
    private static final String GETTER_PREFIX = "get";
    private static final String CGLIB_CLASS_SEPARATOR = "$$";
    private static Logger logger = LoggerFactory.getLogger(ReflectUtils.class);

    public static <E> E invokeGetter(Object obj, String propertyName) {
        Object object = obj;
        for (String name : StringUtils.split((String)propertyName, (String)".")) {
            String getterMethodName = GETTER_PREFIX + StringUtils.capitalize((String)name);
            object = ReflectUtils.invokeMethod(object, getterMethodName, new Class[0], new Object[0]);
        }
        return (E)object;
    }

    public static <E> void invokeSetter(Object obj, String propertyName, E value) {
        Object object = obj;
        String[] names = StringUtils.split((String)propertyName, (String)".");
        for (int i = 0; i < names.length; ++i) {
            if (i < names.length - 1) {
                String getterMethodName = GETTER_PREFIX + StringUtils.capitalize((String)names[i]);
                object = ReflectUtils.invokeMethod(object, getterMethodName, new Class[0], new Object[0]);
                continue;
            }
            String setterMethodName = SETTER_PREFIX + StringUtils.capitalize((String)names[i]);
            ReflectUtils.invokeMethodByName(object, setterMethodName, new Object[]{value});
        }
    }

    public static <E> E getFieldValue(Object obj, String fieldName) {
        Field field = ReflectUtils.getAccessibleField(obj, fieldName);
        if (field == null) {
            logger.debug("\u5728 [" + obj.getClass() + "] \u4e2d\uff0c\u6ca1\u6709\u627e\u5230 [" + fieldName + "] \u5b57\u6bb5 ");
            return null;
        }
        Object result = null;
        try {
            result = field.get(obj);
        }
        catch (IllegalAccessException e) {
            logger.error("\u4e0d\u53ef\u80fd\u629b\u51fa\u7684\u5f02\u5e38{}", (Object)e.getMessage());
        }
        return (E)result;
    }

    public static <E> void setFieldValue(Object obj, String fieldName, E value) {
        Field field = ReflectUtils.getAccessibleField(obj, fieldName);
        if (field == null) {
            logger.debug("\u5728 [" + obj.getClass() + "] \u4e2d\uff0c\u6ca1\u6709\u627e\u5230 [" + fieldName + "] \u5b57\u6bb5 ");
            return;
        }
        try {
            field.set(obj, value);
        }
        catch (IllegalAccessException e) {
            logger.error("\u4e0d\u53ef\u80fd\u629b\u51fa\u7684\u5f02\u5e38: {}", (Object)e.getMessage());
        }
    }

    public static <E> E invokeMethod(Object obj, String methodName, Class<?>[] parameterTypes, Object[] args) {
        if (obj == null || methodName == null) {
            return null;
        }
        Method method = ReflectUtils.getAccessibleMethod(obj, methodName, parameterTypes);
        if (method == null) {
            logger.debug("\u5728 [" + obj.getClass() + "] \u4e2d\uff0c\u6ca1\u6709\u627e\u5230 [" + methodName + "] \u65b9\u6cd5 ");
            return null;
        }
        try {
            return (E)method.invoke(obj, args);
        }
        catch (Exception e) {
            String msg = "method: " + method + ", obj: " + obj + ", args: " + args;
            throw ReflectUtils.convertReflectionExceptionToUnchecked(msg, e);
        }
    }

    public static <E> E invokeMethodByName(Object obj, String methodName, Object[] args) {
        Method method = ReflectUtils.getAccessibleMethodByName(obj, methodName, args.length);
        if (method == null) {
            logger.debug("\u5728 [" + obj.getClass() + "] \u4e2d\uff0c\u6ca1\u6709\u627e\u5230 [" + methodName + "] \u65b9\u6cd5 ");
            return null;
        }
        try {
            Class<?>[] cs = method.getParameterTypes();
            for (int i = 0; i < cs.length; ++i) {
                if (args[i] == null || args[i].getClass().equals(cs[i])) continue;
                if (cs[i] == String.class) {
                    args[i] = Convert.toStr(args[i]);
                    if (!StringUtils.endsWith((CharSequence)((String)args[i]), (CharSequence)".0")) continue;
                    args[i] = StringUtils.substringBefore((String)((String)args[i]), (String)".0");
                    continue;
                }
                if (cs[i] == Integer.class) {
                    args[i] = Convert.toInt(args[i]);
                    continue;
                }
                if (cs[i] == Long.class) {
                    args[i] = Convert.toLong(args[i]);
                    continue;
                }
                if (cs[i] == Double.class) {
                    args[i] = Convert.toDouble(args[i]);
                    continue;
                }
                if (cs[i] == Float.class) {
                    args[i] = Convert.toFloat(args[i]);
                    continue;
                }
                if (cs[i] == Date.class) {
                    if (args[i] instanceof String) {
                        args[i] = DateUtils.parseDate(args[i]);
                        continue;
                    }
                    args[i] = DateUtil.getJavaDate((double)((Double)args[i]));
                    continue;
                }
                if (cs[i] != Boolean.TYPE && cs[i] != Boolean.class) continue;
                args[i] = Convert.toBool(args[i]);
            }
            return (E)method.invoke(obj, args);
        }
        catch (Exception e) {
            String msg = "method: " + method + ", obj: " + obj + ", args: " + args;
            throw ReflectUtils.convertReflectionExceptionToUnchecked(msg, e);
        }
    }

    public static Field getAccessibleField(Object obj, String fieldName) {
        if (obj == null) {
            return null;
        }
        Validate.notBlank((CharSequence)fieldName, (String)"fieldName can't be blank", (Object[])new Object[0]);
        for (Class<?> superClass = obj.getClass(); superClass != Object.class; superClass = superClass.getSuperclass()) {
            try {
                Field field = superClass.getDeclaredField(fieldName);
                ReflectUtils.makeAccessible(field);
                return field;
            }
            catch (NoSuchFieldException e) {
                continue;
            }
        }
        return null;
    }

    public static Method getAccessibleMethod(Object obj, String methodName, Class<?> ... parameterTypes) {
        if (obj == null) {
            return null;
        }
        Validate.notBlank((CharSequence)methodName, (String)"methodName can't be blank", (Object[])new Object[0]);
        for (Class<?> searchType = obj.getClass(); searchType != Object.class; searchType = searchType.getSuperclass()) {
            try {
                Method method = searchType.getDeclaredMethod(methodName, parameterTypes);
                ReflectUtils.makeAccessible(method);
                return method;
            }
            catch (NoSuchMethodException e) {
                continue;
            }
        }
        return null;
    }

    public static Method getAccessibleMethodByName(Object obj, String methodName, int argsNum) {
        if (obj == null) {
            return null;
        }
        Validate.notBlank((CharSequence)methodName, (String)"methodName can't be blank", (Object[])new Object[0]);
        for (Class<?> searchType = obj.getClass(); searchType != Object.class; searchType = searchType.getSuperclass()) {
            Method[] methods;
            for (Method method : methods = searchType.getDeclaredMethods()) {
                if (!method.getName().equals(methodName) || method.getParameterTypes().length != argsNum) continue;
                ReflectUtils.makeAccessible(method);
                return method;
            }
        }
        return null;
    }

    public static void makeAccessible(Method method) {
        if (!(Modifier.isPublic(method.getModifiers()) && Modifier.isPublic(method.getDeclaringClass().getModifiers()) || method.isAccessible())) {
            method.setAccessible(true);
        }
    }

    public static void makeAccessible(Field field) {
        if (!(Modifier.isPublic(field.getModifiers()) && Modifier.isPublic(field.getDeclaringClass().getModifiers()) && !Modifier.isFinal(field.getModifiers()) || field.isAccessible())) {
            field.setAccessible(true);
        }
    }

    public static <T> Class<T> getClassGenricType(Class clazz) {
        return ReflectUtils.getClassGenricType(clazz, 0);
    }

    public static Class getClassGenricType(Class clazz, int index) {
        Type genType = clazz.getGenericSuperclass();
        if (!(genType instanceof ParameterizedType)) {
            logger.debug(clazz.getSimpleName() + "'s superclass not ParameterizedType");
            return Object.class;
        }
        Type[] params = ((ParameterizedType)genType).getActualTypeArguments();
        if (index >= params.length || index < 0) {
            logger.debug("Index: " + index + ", Size of " + clazz.getSimpleName() + "'s Parameterized Type: " + params.length);
            return Object.class;
        }
        if (!(params[index] instanceof Class)) {
            logger.debug(clazz.getSimpleName() + " not set the actual class on superclass generic parameter");
            return Object.class;
        }
        return (Class)params[index];
    }

    public static Class<?> getUserClass(Object instance) {
        Class<?> superClass;
        if (instance == null) {
            throw new RuntimeException("Instance must not be null");
        }
        Class<?> clazz = instance.getClass();
        if (clazz != null && clazz.getName().contains(CGLIB_CLASS_SEPARATOR) && (superClass = clazz.getSuperclass()) != null && !Object.class.equals(superClass)) {
            return superClass;
        }
        return clazz;
    }

    public static RuntimeException convertReflectionExceptionToUnchecked(String msg, Exception e) {
        if (e instanceof IllegalAccessException || e instanceof IllegalArgumentException || e instanceof NoSuchMethodException) {
            return new IllegalArgumentException(msg, e);
        }
        if (e instanceof InvocationTargetException) {
            return new RuntimeException(msg, ((InvocationTargetException)e).getTargetException());
        }
        return new RuntimeException(msg, e);
    }
}

