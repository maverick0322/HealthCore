package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsRequest;
import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsResponse;
import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResult;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class MediaGrpcClientAdapter {

    private static final int GRPC_TIMEOUT_SECONDS = 5;
    private static final Logger log = LoggerFactory.getLogger(MediaGrpcClientAdapter.class);

    private final MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub mediaStub;
    private final ManagedChannel managedChannel;

    @Autowired
    public MediaGrpcClientAdapter(@Value("${grpc.media.target:media-service:9091}") String grpcTarget) {
        log.info("Initializing gRPC client for Media Service at target: {}", grpcTarget);
        this.managedChannel = ManagedChannelBuilder.forTarget(grpcTarget)
                .usePlaintext()
                .build();
        this.mediaStub = MediaServiceGrpcGrpc.newBlockingStub(managedChannel);
    }

    MediaGrpcClientAdapter(MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub mediaStub) {
        this.mediaStub = mediaStub;
        this.managedChannel = null;
    }

    public String getPresignedReadUrl(String profilePhotoKey) {
        if (profilePhotoKey == null || profilePhotoKey.isBlank()) {
            return null;
        }

        try {
            PresignedReadUrlRequest request = PresignedReadUrlRequest.newBuilder()
                    .setStorageKey(profilePhotoKey)
                    .build();

            PresignedReadUrlResponse response = mediaStub
                    .withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getPresignedReadUrl(request);
            if (!response.getErrorMessage().isEmpty()) {
                log.warn("Media service returned an error while resolving profile photo keyHash={}: {}",
                        keyHash(profilePhotoKey), response.getErrorMessage());
                return null;
            }

            return response.getPresignedUrl();
        } catch (StatusRuntimeException ex) {
            log.warn("Media service request failed while resolving profile photo keyHash={} status={}",
                    keyHash(profilePhotoKey), ex.getStatus(), ex);
            return null;
        } catch (Exception ex) {
            log.error("Could not resolve presigned read url for profile photo keyHash={}",
                    keyHash(profilePhotoKey), ex);
            return null;
        }
    }

    public Map<String, String> getPresignedReadUrls(List<String> profilePhotoKeys) {
        if (profilePhotoKeys == null || profilePhotoKeys.isEmpty()) {
            return Map.of();
        }

        List<String> normalizedKeys = profilePhotoKeys.stream()
                .filter(key -> key != null && !key.isBlank())
                .distinct()
                .toList();
        if (normalizedKeys.isEmpty()) {
            return Map.of();
        }

        try {
            BatchPresignedReadUrlsRequest request = BatchPresignedReadUrlsRequest.newBuilder()
                    .addAllStorageKeys(normalizedKeys)
                    .build();

            BatchPresignedReadUrlsResponse response = mediaStub
                    .withDeadlineAfter(GRPC_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .getPresignedReadUrls(request);

            Map<String, String> resolvedUrls = new LinkedHashMap<>();
            for (PresignedReadUrlResult result : response.getResultsList()) {
                if (!result.getErrorMessage().isEmpty()) {
                    log.warn("Media service returned a batch error while resolving profile photo keyHash={}: {}",
                            safeKeyHash(result.getStorageKey()), result.getErrorMessage());
                    continue;
                }
                if (!result.getStorageKey().isBlank() && !result.getPresignedUrl().isBlank()) {
                    resolvedUrls.put(result.getStorageKey(), result.getPresignedUrl());
                }
            }

            return resolvedUrls;
        } catch (StatusRuntimeException ex) {
            log.warn("Media service batch request failed while resolving {} profile photo keys status={}",
                    normalizedKeys.size(), ex.getStatus(), ex);
            return Map.of();
        } catch (Exception ex) {
            log.error("Could not resolve batch presigned read urls for {} profile photo keys",
                    normalizedKeys.size(), ex);
            return Map.of();
        }
    }

    @PreDestroy
    void shutdown() {
        if (managedChannel != null) {
            managedChannel.shutdown();
        }
    }

    private String keyHash(String profilePhotoKey) {
        return Integer.toHexString(profilePhotoKey.hashCode());
    }

    private String safeKeyHash(String profilePhotoKey) {
        return profilePhotoKey == null || profilePhotoKey.isBlank() ? "unknown" : keyHash(profilePhotoKey);
    }
}
