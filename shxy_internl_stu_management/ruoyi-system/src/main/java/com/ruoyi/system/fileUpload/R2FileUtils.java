package com.ruoyi.system.fileUpload;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class R2FileUtils implements InitializingBean {

    public static String END_POINT;
    public static String REGION;
    public static String BUCKET_NAME;
    public static String CDN_DOMAIN;
    public static String ACCESS_KEY;
    public static String SECRET_KEY;

    @Value("${cloud.aws.s3.endpoint}")
    private String endpoint;

    @Value("${cloud.aws.s3.region}")
    private String region;

    @Value("${cloud.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${cloud.aws.s3.cdn-domain}")
    private String cdnDomain;

    @Value("${cloud.aws.s3.credentials.access-key}")
    private String accessKey;

    @Value("${cloud.aws.s3.credentials.secret-key}")
    private String secretKey;

    @Override
    public void afterPropertiesSet() throws Exception {
        END_POINT = this.endpoint;
        REGION = this.region;
        BUCKET_NAME = this.bucketName;
        CDN_DOMAIN = this.cdnDomain;
        ACCESS_KEY = this.accessKey;
        SECRET_KEY = this.secretKey;
    }
}
