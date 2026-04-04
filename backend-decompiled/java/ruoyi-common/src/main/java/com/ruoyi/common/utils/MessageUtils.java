/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.context.MessageSource
 *  org.springframework.context.i18n.LocaleContextHolder
 */
package com.ruoyi.common.utils;

import com.ruoyi.common.utils.spring.SpringUtils;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

public class MessageUtils {
    public static String message(String code, Object ... args) {
        MessageSource messageSource = SpringUtils.getBean(MessageSource.class);
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }
}

