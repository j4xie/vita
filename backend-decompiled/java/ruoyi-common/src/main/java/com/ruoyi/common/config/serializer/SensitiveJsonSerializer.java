/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.core.JsonGenerator
 *  com.fasterxml.jackson.databind.BeanProperty
 *  com.fasterxml.jackson.databind.JsonMappingException
 *  com.fasterxml.jackson.databind.JsonSerializer
 *  com.fasterxml.jackson.databind.SerializerProvider
 *  com.fasterxml.jackson.databind.ser.ContextualSerializer
 */
package com.ruoyi.common.config.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.ContextualSerializer;
import com.ruoyi.common.annotation.Sensitive;
import com.ruoyi.common.core.domain.model.LoginUser;
import com.ruoyi.common.enums.DesensitizedType;
import com.ruoyi.common.utils.SecurityUtils;
import java.io.IOException;
import java.util.Objects;

public class SensitiveJsonSerializer
extends JsonSerializer<String>
implements ContextualSerializer {
    private DesensitizedType desensitizedType;

    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (this.desensitization()) {
            gen.writeString(this.desensitizedType.desensitizer().apply(value));
        } else {
            gen.writeString(value);
        }
    }

    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property) throws JsonMappingException {
        Sensitive annotation = (Sensitive)property.getAnnotation(Sensitive.class);
        if (Objects.nonNull(annotation) && Objects.equals(String.class, property.getType().getRawClass())) {
            this.desensitizedType = annotation.desensitizedType();
            return this;
        }
        return prov.findValueSerializer(property.getType(), property);
    }

    private boolean desensitization() {
        try {
            LoginUser securityUser = SecurityUtils.getLoginUser();
            return !securityUser.getUser().isAdmin();
        }
        catch (Exception e) {
            return true;
        }
    }
}

