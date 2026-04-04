/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.boot.SpringApplication
 *  org.springframework.boot.autoconfigure.SpringBootApplication
 *  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
 */
package com.ruoyi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude={DataSourceAutoConfiguration.class})
public class RuoYiApplication {
    public static void main(String[] args) {
        SpringApplication.run(RuoYiApplication.class, (String[])args);
        System.out.println("======================================");
        System.out.println("=================\u542f\u52a8\u6210\u529f==============");
        System.out.println("=====================================");
    }
}
