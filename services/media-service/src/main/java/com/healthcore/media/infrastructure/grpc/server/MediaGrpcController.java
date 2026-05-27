package com.healthcore.media.infrastructure.grpc.server;

import com.healthcore.media.domain.port.MediaStoragePort;
import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsRequest;
import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsResponse;
import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResult;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class MediaGrpcController extends MediaServiceGrpcGrpc.MediaServiceGrpcImplBase {

    private final MediaStoragePort mediaStoragePort;

    @Override
    public void getPresignedReadUrl(PresignedReadUrlRequest request,
                                    StreamObserver<PresignedReadUrlResponse> responseObserver) {

        String storageKey = request.getStorageKey();

        try {
            String presignedUrl = mediaStoragePort.generateDownloadUrl(storageKey);

            PresignedReadUrlResponse response = PresignedReadUrlResponse.newBuilder()
                    .setPresignedUrl(presignedUrl)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();

        } catch (Exception e) {
            log.error("Error generating presigned read URL via gRPC for key: {}", storageKey, e);

            PresignedReadUrlResponse response = PresignedReadUrlResponse.newBuilder()
                    .setPresignedUrl("")
                    .setErrorMessage("Internal error generating URL")
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
    }

    @Override
    public void getPresignedReadUrls(
            BatchPresignedReadUrlsRequest request,
            StreamObserver<BatchPresignedReadUrlsResponse> responseObserver
    ) {
        BatchPresignedReadUrlsResponse response = BatchPresignedReadUrlsResponse.newBuilder()
                .addAllResults(request.getStorageKeysList().stream()
                        .map(this::resolveReadUrlResult)
                        .toList())
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    private PresignedReadUrlResult resolveReadUrlResult(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return PresignedReadUrlResult.newBuilder()
                    .setStorageKey("")
                    .setPresignedUrl("")
                    .setErrorMessage("Storage key is required")
                    .build();
        }

        try {
            return PresignedReadUrlResult.newBuilder()
                    .setStorageKey(storageKey)
                    .setPresignedUrl(mediaStoragePort.generateDownloadUrl(storageKey))
                    .build();
        } catch (Exception exception) {
            log.error("Error generating batch presigned read URL via gRPC for keyHash={}",
                    keyHash(storageKey), exception);
            return PresignedReadUrlResult.newBuilder()
                    .setStorageKey(storageKey)
                    .setPresignedUrl("")
                    .setErrorMessage("Internal error generating URL")
                    .build();
        }
    }

    private String keyHash(String storageKey) {
        return Integer.toHexString(storageKey.hashCode());
    }
}
