/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.annotation;

import com.ruoyi.common.enums.LimitType;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(value={ElementType.METHOD})
@Retention(value=RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimiter {
    public String key() default "rate_limit:";

    public int time() default 60;

    public int count() default 100;

    public LimitType limitType() default LimitType.DEFAULT;
}

