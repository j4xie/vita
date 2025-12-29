package com.ruoyi.system.controller;

import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.fileUpload.CloudFlareR2ServiceImpl;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/file")
@Api(tags = "文件上传接口")
public class FileUploadController {


    @Autowired
    private CloudFlareR2ServiceImpl cloudFlareR2Service;


    @PostMapping("/upload")
    public AjaxResult uploadToR2(MultipartFile file) {
        // 前置校验
        if (file.isEmpty()) {
            return AjaxResult.error();
        }
        //在路径方法上使用, 上传到R2
        String r2Url = null;
        try {
            r2Url = cloudFlareR2Service.upload(file);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        AjaxResult ajaxResult = AjaxResult.success();
        //查看生成的路径, 可直接通过URL访问资源
        System.out.println(r2Url);
        ajaxResult.put("data", "https://" + r2Url);
        ajaxResult.put("msg", "上传成功");
        return ajaxResult;
    }

}
