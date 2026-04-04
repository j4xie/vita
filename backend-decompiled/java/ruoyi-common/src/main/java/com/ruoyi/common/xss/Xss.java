/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.Constraint
 *  javax.validation.Payload
 */
package com.ruoyi.common.xss;

import com.ruoyi.common.xss.XssValidator;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import javax.validation.Constraint;
import javax.validation.Payload;

@Retention(value=RetentionPolicy.RUNTIME)
@Target(value={ElementType.METHOD, ElementType.FIELD, ElementType.CONSTRUCTOR, ElementType.PARAMETER})
@Constraint(validatedBy={XssValidator.class})
public @interface Xss {
    public String message() default "\u4e0d\u5141\u8bb8\u4efb\u4f55\u811a\u672c\u8fd0\u884c";

    public Class<?>[] groups() default {};

    public Class<? extends Payload>[] payload() default {};
}

