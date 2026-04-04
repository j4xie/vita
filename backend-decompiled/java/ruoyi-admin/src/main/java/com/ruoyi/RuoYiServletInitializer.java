/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.boot.builder.SpringApplicationBuilder
 *  org.springframework.boot.web.servlet.support.SpringBootServletInitializer
 */
package com.ruoyi;

import com.ruoyi.RuoYiApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

public class RuoYiServletInitializer
extends SpringBootServletInitializer {
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(new Class[]{RuoYiApplication.class});
    }
}
