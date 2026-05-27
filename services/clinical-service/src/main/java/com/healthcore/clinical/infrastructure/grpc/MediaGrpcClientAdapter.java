package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MediaGrpcClientAdapter {

    private static final Logger log = LoggerFactory.getLogger(MediaGrpcClientAdapter.class);

    private final MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub mediaStub;
    private final ManagedChannel managedChannel;

    public MediaGrpcClientAdapter(@Value("${grpc.media.target:media-service:9091}") String grpcTarget) {
        log.info("Initializing gRPC client for Media Service at target: {}", grpcTarget);
        this.managedChannel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();
        this.mediaStub = MediaServiceGrpcGrpc.newBlockingStub(managedChannel);
    }

    public String getPresignedReadUrl(String profilePhotoKey) {
        if (profilePhotoKey == null || profilePhotoKey.isBlank()) {
            return null;
        }

        try {
            PresignedReadUrlRequest request = PresignedReadUrlRequest.newBuilder()
                    .setStorageKey(profilePhotoKey)
                    .build();

            PresignedReadUrlResponse response = mediaStub.getPresignedReadUrl(request);
            if (!response.getErrorMessage().isEmpty()) {
                log.warn("Media service returned an error while resolving profile photo key {}: {}",
                        profilePhotoKey, response.getErrorMessage());
                return null;
            }

            return response.getPresignedUrl();
        } catch (Exception ex) {
            log.error("Could not resolve presigned read url for profile photo key {}", profilePhotoKey, ex);
            return null;
        }
    }

    @PreDestroy
    void shutdown() {
        managedChannel.shutdown();
    }
}
