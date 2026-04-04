/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.ruoyi.common.core.domain.AjaxResult
 *  io.swagger.annotations.Api
 *  org.springframework.beans.factory.annotation.Autowired
 *  org.springframework.web.bind.annotation.PostMapping
 *  org.springframework.web.bind.annotation.RequestMapping
 *  org.springframework.web.bind.annotation.RestController
 *  org.springframework.web.multipart.MultipartFile
 */
package com.ruoyi.system.controller;

import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.fileUpload.CloudFlareR2ServiceImpl;
import io.swagger.annotations.Api;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value={"/file"})
@Api(tags={"\u6587\u4ef6\u4e0a\u4f20\u63a5\u53e3"})
public class FileUploadController {
    @Autowired
    private CloudFlareR2ServiceImpl cloudFlareR2Service;

    @PostMapping(value={"/upload"})
    public AjaxResult uploadToR2(MultipartFile file) {
        if (file.isEmpty()) {
            return AjaxResult.error();
        }
        String r2Url = null;
        try {
            r2Url = this.cloudFlareR2Service.upload(file);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
        AjaxResult ajaxResult = AjaxResult.success();
        System.out.println(r2Url);
        ajaxResult.put("data", (Object)("https://" + r2Url));
        ajaxResult.put("msg", (Object)"\u4e0a\u4f20\u6210\u529f");
        return ajaxResult;
    }
}

