/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.annotation;

import com.ruoyi.common.enums.DataSourceType;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(value={ElementType.METHOD, ElementType.TYPE})
@Retention(value=RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface DataSource {
    public DataSourceType value() default DataSourceType.MASTER;
}

