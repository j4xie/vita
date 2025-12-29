package com.ruoyi.system.fileUpload;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.regions.Region;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
@Service
public class CloudFlareR2ServiceImpl {
    public String upload(MultipartFile file) throws IOException {
        //使用try-with, S3Client在使用完毕后需要自动关闭
        try(InputStream inputStream = file.getInputStream();
            S3Client client = S3Client.builder()
                    .endpointOverride(URI.create(R2FileUtils.END_POINT))    //访问端点
                    .credentialsProvider(() -> AwsBasicCredentials.create(R2FileUtils.ACCESS_KEY, R2FileUtils.SECRET_KEY))  //访问凭证
                    .region(Region.of(R2FileUtils.REGION))  //地区
                    .build()) {

            //获取当前日期, 利用当前日期构建对象键的路径, 如2025/05/27
            //实际路径可根据开发情况修改
            String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

            //获取文件扩展名
            //获取上传文件的原始文件名, 即包含扩展名
            String originalFilename = file.getOriginalFilename();
            assert originalFilename != null;
            //获取源文件扩展名
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));

            //构建对象键, 包含日期路径、使用UUID随机生成的文件名
            //实际文件名可根据开发情况修改
            String objectKey = date + "/" + UUID.randomUUID() + fileExtension;

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(R2FileUtils.BUCKET_NAME)    //设置存储桶名称
                    .key(objectKey)     //设置对象键
                    .contentType(file.getContentType()) //设置内容类型
                    .build();
            //使用S3Client将文件上传到R2
            client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, file.getSize()));

            //返回上传后的文件访问URL
            return R2FileUtils.CDN_DOMAIN + "/" + objectKey;
        }catch (Exception e){
            //抛异常
            throw new IOException("文件上传失败"+e.getMessage());
        }
    }
}