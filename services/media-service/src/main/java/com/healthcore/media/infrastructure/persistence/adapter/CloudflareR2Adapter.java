package com.healthcore.media.infrastructure.persistence.adapter;

import com.healthcore.media.domain.port.MediaStoragePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class CloudflareR2Adapter implements MediaStoragePort {

    private final S3Presigner s3Presigner;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Override
    public String generateUploadUrl(String fileName) {
        log.info("Generating pre-signed URL for file: {} in bucket: {}", fileName, bucketName);

        // 1. Definimos la petición de subida básica (Símil HTTP PUT)
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        // 2. Envolvemos la petición definiendo la expiración temporal (5 minutos)
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .putObjectRequest(objectRequest)
                .build();

        // 3. El Presigner calcula criptográficamente la firma localmente
        return s3Presigner.presignPutObject(presignRequest).url().toString();
    }
}