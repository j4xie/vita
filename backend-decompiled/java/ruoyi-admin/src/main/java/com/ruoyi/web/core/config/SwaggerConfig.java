/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.config.RuoYiConfig
 *  io.swagger.annotations.ApiOperation
 *  io.swagger.models.auth.In
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.beans.factory.annotation.Value
 *  org.springframework.context.annotation.Bean
 *  org.springframework.context.annotation.Configuration
 *  springfox.documentation.builders.ApiInfoBuilder
 *  springfox.documentation.builders.PathSelectors
 *  springfox.documentation.builders.RequestHandlerSelectors
 *  springfox.documentation.service.ApiInfo
 *  springfox.documentation.service.ApiKey
 *  springfox.documentation.service.AuthorizationScope
 *  springfox.documentation.service.Contact
 *  springfox.documentation.service.SecurityReference
 *  springfox.documentation.service.SecurityScheme
 *  springfox.documentation.spi.DocumentationType
 *  springfox.documentation.spi.service.contexts.SecurityContext
 *  springfox.documentation.spring.web.plugins.Docket
 */
package com.ruoyi.web.core.config;

import com.ruoyi.common.config.RuoYiConfig;
import io.swagger.annotations.ApiOperation;
import io.swagger.models.auth.In;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.ApiKey;
import springfox.documentation.service.AuthorizationScope;
import springfox.documentation.service.Contact;
import springfox.documentation.service.SecurityReference;
import springfox.documentation.service.SecurityScheme;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.service.contexts.SecurityContext;
import springfox.documentation.spring.web.plugins.Docket;

@Configuration
public class SwaggerConfig {
    @Autowired
    private RuoYiConfig ruoyiConfig;
    @Value(value="${swagger.enabled}")
    private boolean enabled;
    @Value(value="${swagger.pathMapping}")
    private String pathMapping;

    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.OAS_30).enable(this.enabled).apiInfo(this.apiInfo()).select().apis(RequestHandlerSelectors.withMethodAnnotation(ApiOperation.class)).paths(PathSelectors.any()).build().securitySchemes(this.securitySchemes()).securityContexts(this.securityContexts()).pathMapping(this.pathMapping);
    }

    private List<SecurityScheme> securitySchemes() {
        ArrayList<SecurityScheme> apiKeyList = new ArrayList<SecurityScheme>();
        apiKeyList.add((SecurityScheme)new ApiKey("Authorization", "Authorization", In.HEADER.toValue()));
        return apiKeyList;
    }

    private List<SecurityContext> securityContexts() {
        ArrayList<SecurityContext> securityContexts = new ArrayList<SecurityContext>();
        securityContexts.add(SecurityContext.builder().securityReferences(this.defaultAuth()).operationSelector(o -> o.requestMappingPattern().matches("/.*")).build());
        return securityContexts;
    }

    private List<SecurityReference> defaultAuth() {
        AuthorizationScope authorizationScope = new AuthorizationScope("global", "accessEverything");
        AuthorizationScope[] authorizationScopes = new AuthorizationScope[]{authorizationScope};
        ArrayList<SecurityReference> securityReferences = new ArrayList<SecurityReference>();
        securityReferences.add(new SecurityReference("Authorization", authorizationScopes));
        return securityReferences;
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder().title("\u6807\u9898\uff1a\u82e5\u4f9d\u7ba1\u7406\u7cfb\u7edf_\u63a5\u53e3\u6587\u6863").description("\u63cf\u8ff0\uff1a\u7528\u4e8e\u7ba1\u7406\u96c6\u56e2\u65d7\u4e0b\u516c\u53f8\u7684\u4eba\u5458\u4fe1\u606f,\u5177\u4f53\u5305\u62ecXXX,XXX\u6a21\u5757...").contact(new Contact(this.ruoyiConfig.getName(), null, null)).version("\u7248\u672c\u53f7:" + this.ruoyiConfig.getVersion()).build();
    }
}
