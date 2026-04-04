/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.google.code.kaptcha.Producer
 *  com.ruoyi.common.annotation.Anonymous
 *  com.ruoyi.common.config.RuoYiConfig
 *  com.ruoyi.common.constant.Constants
 *  com.ruoyi.common.core.domain.AjaxResult
 *  com.ruoyi.common.core.redis.RedisCache
 *  com.ruoyi.common.utils.sign.Base64
 *  com.ruoyi.common.utils.uuid.IdUtils
 *  com.ruoyi.system.service.ISysConfigService
 *  javax.annotation.Resource
 *  javax.servlet.http.HttpServletResponse
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.util.FastByteArrayOutputStream
 *  org.springframework.web.bind.annotation.GetMapping
 *  org.springframework.web.bind.annotation.RestController
 */
package com.ruoyi.web.controller.common;

import com.google.code.kaptcha.Producer;
import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.config.RuoYiConfig;
import com.ruoyi.common.constant.Constants;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.redis.RedisCache;
import com.ruoyi.common.utils.sign.Base64;
import com.ruoyi.common.utils.uuid.IdUtils;
import com.ruoyi.system.service.ISysConfigService;
import java.awt.image.BufferedImage;
import java.awt.image.RenderedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.util.concurrent.TimeUnit;
import javax.annotation.Resource;
import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.FastByteArrayOutputStream;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Anonymous
public class CaptchaController {
    @Resource(name="captchaProducer")
    private Producer captchaProducer;
    @Resource(name="captchaProducerMath")
    private Producer captchaProducerMath;
    @Autowired
    private RedisCache redisCache;
    @Autowired
    private ISysConfigService configService;

    @GetMapping(value={"/captchaImage"})
    public AjaxResult getCode(HttpServletResponse response) throws IOException {
        AjaxResult ajax = AjaxResult.success();
        boolean captchaEnabled = this.configService.selectCaptchaEnabled();
        ajax.put("captchaEnabled", (Object)captchaEnabled);
        if (!captchaEnabled) {
            return ajax;
        }
        String uuid = IdUtils.simpleUUID();
        String verifyKey = "captcha_codes:" + uuid;
        String capStr = null;
        String code = null;
        BufferedImage image = null;
        String captchaType = RuoYiConfig.getCaptchaType();
        if ("math".equals(captchaType)) {
            String capText = this.captchaProducerMath.createText();
            capStr = capText.substring(0, capText.lastIndexOf("@"));
            code = capText.substring(capText.lastIndexOf("@") + 1);
            image = this.captchaProducerMath.createImage(capStr);
        } else if ("char".equals(captchaType)) {
            capStr = code = this.captchaProducer.createText();
            image = this.captchaProducer.createImage(capStr);
        }
        this.redisCache.setCacheObject(verifyKey, (Object)code, Constants.CAPTCHA_EXPIRATION, TimeUnit.MINUTES);
        FastByteArrayOutputStream os = new FastByteArrayOutputStream();
        try {
            ImageIO.write((RenderedImage)image, "jpg", (OutputStream)os);
        }
        catch (IOException e) {
            return AjaxResult.error((String)e.getMessage());
        }
        ajax.put("uuid", (Object)uuid);
        ajax.put("img", (Object)Base64.encode((byte[])os.toByteArray()));
        return ajax;
    }
}
