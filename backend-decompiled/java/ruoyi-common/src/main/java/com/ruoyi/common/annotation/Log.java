/*
 * Decompiled with CFR 0.152.
 */
package com.ruoyi.common.annotation;

import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.common.enums.OperatorType;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(value={ElementType.PARAMETER, ElementType.METHOD})
@Retention(value=RetentionPolicy.RUNTIME)
@Documented
public @interface Log {
    public String title() default "";

    public BusinessType businessType() default BusinessType.OTHER;

    public OperatorType operatorType() default OperatorType.MANAGE;

    public boolean isSaveRequestData() default true;

    public boolean isSaveResponseData() default true;

    public String[] excludeParamNames() default {};
}

