package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

/**
 * gRPC Client Adapter.
 * Encapsulates the network call to the media-service to retrieve secure URLs.
 */
@Slf4j
@Component
public class MediaGrpcClientAdapter {

    @GrpcClient("media-service")
    private MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub mediaStub;

    public String getPresignedReadUrl(String photoKey) {
        if (photoKey == null || photoKey.isBlank()) {
            return null;
        }

        try {
            PresignedReadUrlRequest request = PresignedReadUrlRequest.newBuilder()
                    .setStorageKey(photoKey)
                    .build();

            PresignedReadUrlResponse response = mediaStub.getPresignedReadUrl(request);

            if (!response.getErrorMessage().isEmpty()) {
                log.warn("Media service reported an error for key {}: {}", photoKey, response.getErrorMessage());
                return null;
            }

            return response.getPresignedUrl();

        } catch (Exception e) {
            // Manejo defensivo: Si el media-service está caído, no rompemos el dashboard.
            log.error("gRPC call to media-service failed for photoKey: {}", photoKey, e);
            return null;
        }
    }
}