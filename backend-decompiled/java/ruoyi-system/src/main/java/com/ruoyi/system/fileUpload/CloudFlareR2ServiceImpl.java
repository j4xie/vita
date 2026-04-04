/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  org.springframework.stereotype.Service
 *  org.springframework.web.multipart.MultipartFile
 *  software.amazon.awssdk.auth.credentials.AwsBasicCredentials
 *  software.amazon.awssdk.core.sync.RequestBody
 *  software.amazon.awssdk.regions.Region
 *  software.amazon.awssdk.services.s3.S3Client
 *  software.amazon.awssdk.services.s3.S3ClientBuilder
 *  software.amazon.awssdk.services.s3.model.PutObjectRequest
 */
package com.ruoyi.system.fileUpload;

import com.ruoyi.system.fileUpload.R2FileUtils;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class CloudFlareR2ServiceImpl {
    /*
     * Enabled aggressive exception aggregation
     */
    public String upload(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream();){
            String string;
            block15: {
                S3Client client = (S3Client)((S3ClientBuilder)((S3ClientBuilder)((S3ClientBuilder)S3Client.builder().endpointOverride(URI.create(R2FileUtils.END_POINT))).credentialsProvider(() -> AwsBasicCredentials.create((String)R2FileUtils.ACCESS_KEY, (String)R2FileUtils.SECRET_KEY))).region(Region.of((String)R2FileUtils.REGION))).build();
                try {
                    String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
                    String originalFilename = file.getOriginalFilename();
                    assert (originalFilename != null);
                    String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String objectKey = date + "/" + UUID.randomUUID() + fileExtension;
                    PutObjectRequest putObjectRequest = (PutObjectRequest)PutObjectRequest.builder().bucket(R2FileUtils.BUCKET_NAME).key(objectKey).contentType(file.getContentType()).build();
                    client.putObject(putObjectRequest, RequestBody.fromInputStream((InputStream)inputStream, (long)file.getSize()));
                    string = R2FileUtils.CDN_DOMAIN + "/" + objectKey;
                    if (client == null) break block15;
                }
                catch (Throwable throwable) {
                    if (client != null) {
                        try {
                            client.close();
                        }
                        catch (Throwable throwable2) {
                            throwable.addSuppressed(throwable2);
                        }
                    }
                    throw throwable;
                }
                client.close();
            }
            return string;
        }
        catch (Exception e) {
            throw new IOException("\u6587\u4ef6\u4e0a\u4f20\u5931\u8d25" + e.getMessage());
        }
    }
}

