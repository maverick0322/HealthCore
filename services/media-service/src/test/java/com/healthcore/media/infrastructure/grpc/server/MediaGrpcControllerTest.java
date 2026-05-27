package com.healthcore.media.infrastructure.grpc.server;

import com.healthcore.media.domain.port.MediaStoragePort;
import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsRequest;
import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsResponse;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaGrpcControllerTest {

    @Mock
    private MediaStoragePort mediaStoragePort;

    @Mock
    private StreamObserver<PresignedReadUrlResponse> singleResponseObserver;

    @Mock
    private StreamObserver<BatchPresignedReadUrlsResponse> batchResponseObserver;

    @Test
    void shouldReturnPresignedReadUrlForSingleKey() {
        MediaGrpcController controller = new MediaGrpcController(mediaStoragePort);
        when(mediaStoragePort.generateDownloadUrl("user-1/avatar.webp"))
                .thenReturn("https://cdn.example.com/user-1/avatar.webp");

        controller.getPresignedReadUrl(
                PresignedReadUrlRequest.newBuilder().setStorageKey("user-1/avatar.webp").build(),
                singleResponseObserver
        );

        ArgumentCaptor<PresignedReadUrlResponse> captor = ArgumentCaptor.forClass(PresignedReadUrlResponse.class);
        verify(singleResponseObserver).onNext(captor.capture());
        verify(singleResponseObserver).onCompleted();
        assertEquals("https://cdn.example.com/user-1/avatar.webp", captor.getValue().getPresignedUrl());
        assertEquals("", captor.getValue().getErrorMessage());
    }

    @Test
    void shouldReturnBatchPresignedReadUrlsWithPartialFailures() {
        MediaGrpcController controller = new MediaGrpcController(mediaStoragePort);
        when(mediaStoragePort.generateDownloadUrl("user-1/avatar.webp"))
                .thenReturn("https://cdn.example.com/user-1/avatar.webp");
        doThrow(new IllegalStateException("boom"))
                .when(mediaStoragePort).generateDownloadUrl("user-2/avatar.webp");

        controller.getPresignedReadUrls(
                BatchPresignedReadUrlsRequest.newBuilder()
                        .addStorageKeys("user-1/avatar.webp")
                        .addStorageKeys("user-2/avatar.webp")
                        .addStorageKeys("")
                        .build(),
                batchResponseObserver
        );

        ArgumentCaptor<BatchPresignedReadUrlsResponse> captor =
                ArgumentCaptor.forClass(BatchPresignedReadUrlsResponse.class);
        verify(batchResponseObserver).onNext(captor.capture());
        verify(batchResponseObserver).onCompleted();

        BatchPresignedReadUrlsResponse response = captor.getValue();
        assertEquals(3, response.getResultsCount());
        assertEquals("user-1/avatar.webp", response.getResults(0).getStorageKey());
        assertEquals("https://cdn.example.com/user-1/avatar.webp", response.getResults(0).getPresignedUrl());
        assertEquals("", response.getResults(0).getErrorMessage());

        assertEquals("user-2/avatar.webp", response.getResults(1).getStorageKey());
        assertEquals("", response.getResults(1).getPresignedUrl());
        assertEquals("Internal error generating URL", response.getResults(1).getErrorMessage());

        assertEquals("", response.getResults(2).getStorageKey());
        assertEquals("Storage key is required", response.getResults(2).getErrorMessage());
    }
}
