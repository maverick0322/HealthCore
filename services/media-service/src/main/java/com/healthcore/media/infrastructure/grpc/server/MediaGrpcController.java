package com.healthcore.media.infrastructure.grpc.server;

import com.healthcore.media.domain.port.MediaStoragePort;
import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
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
}