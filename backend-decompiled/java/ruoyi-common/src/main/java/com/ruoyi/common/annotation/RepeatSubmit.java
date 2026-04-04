/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Inherited
@Target(value={ElementType.METHOD})
@Retention(value=RetentionPolicy.RUNTIME)
@Documented
public @interface RepeatSubmit {
    public int interval() default 5000;

    public String message() default "\u4e0d\u5141\u8bb8\u91cd\u590d\u63d0\u4ea4\uff0c\u8bf7\u7a0d\u5019\u518d\u8bd5";
}

