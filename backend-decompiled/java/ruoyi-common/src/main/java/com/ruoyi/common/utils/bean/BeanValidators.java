/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javax.validation.ConstraintViolationException
 *  javax.validation.Validator
 */
package com.ruoyi.common.utils.bean;

import java.util.Set;
import javax.validation.ConstraintViolationException;
import javax.validation.Validator;

public class BeanValidators {
    public static void validateWithException(Validator validator, Object object, Class<?> ... groups) throws ConstraintViolationException {
        Set constraintViolations = validator.validate(object, (Class[])groups);
        if (!constraintViolations.isEmpty()) {
            throw new ConstraintViolationException(constraintViolations);
        }
    }
}

