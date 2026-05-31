package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.media.infrastructure.grpc.stubs.BatchPresignedReadUrlsResponse;
import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResult;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaGrpcClientAdapterTest {

    @Mock
    private MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub mediaStub;

    @Mock
    private MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub deadlineStub;

    @Test
    void shouldReturnNullWhenProfilePhotoKeyIsBlank() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);

        assertNull(adapter.getPresignedReadUrl("   "));
        verify(mediaStub, never()).withDeadlineAfter(any(Long.class), any(TimeUnit.class));
    }

    @Test
    void shouldResolvePresignedReadUrlWithDeadline() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);
        PresignedReadUrlResponse response = PresignedReadUrlResponse.newBuilder()
                .setPresignedUrl("https://cdn.example/avatar.webp")
                .build();

        when(mediaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getPresignedReadUrl(any(PresignedReadUrlRequest.class))).thenReturn(response);

        String result = adapter.getPresignedReadUrl("user-123/avatar.webp");

        assertEquals("https://cdn.example/avatar.webp", result);
        verify(mediaStub).withDeadlineAfter(5, TimeUnit.SECONDS);
    }

    @Test
    void shouldReturnNullWhenMediaServiceRespondsWithErrorMessage() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);
        PresignedReadUrlResponse response = PresignedReadUrlResponse.newBuilder()
                .setErrorMessage("Internal error generating URL")
                .build();

        when(mediaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getPresignedReadUrl(any(PresignedReadUrlRequest.class))).thenReturn(response);

        assertNull(adapter.getPresignedReadUrl("user-123/avatar.webp"));
    }

    @Test
    void shouldReturnNullWhenMediaServiceThrowsGrpcException() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);

        when(mediaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getPresignedReadUrl(any(PresignedReadUrlRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.DEADLINE_EXCEEDED));

        assertNull(adapter.getPresignedReadUrl("user-123/avatar.webp"));
        verify(mediaStub).withDeadlineAfter(eq(5L), eq(TimeUnit.SECONDS));
    }

    @Test
    void shouldResolveBatchPresignedReadUrls() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);
        BatchPresignedReadUrlsResponse response = BatchPresignedReadUrlsResponse.newBuilder()
                .addResults(PresignedReadUrlResult.newBuilder()
                        .setStorageKey("user-1/avatar.webp")
                        .setPresignedUrl("https://cdn.example.com/user-1/avatar.webp")
                        .build())
                .addResults(PresignedReadUrlResult.newBuilder()
                        .setStorageKey("user-2/avatar.webp")
                        .setErrorMessage("Internal error generating URL")
                        .build())
                .build();

        when(mediaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getPresignedReadUrls(any())).thenReturn(response);

        Map<String, String> result = adapter.getPresignedReadUrls(List.of(
                "user-1/avatar.webp",
                "user-2/avatar.webp",
                "user-1/avatar.webp"
        ));

        assertEquals(1, result.size());
        assertEquals("https://cdn.example.com/user-1/avatar.webp", result.get("user-1/avatar.webp"));
        verify(mediaStub).withDeadlineAfter(5, TimeUnit.SECONDS);
    }

    @Test
    void shouldReturnEmptyMapWhenBatchKeysAreBlankOrNull() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);

        Map<String, String> result = adapter.getPresignedReadUrls(List.of(" ", "", "\t"));

        assertEquals(Map.of(), result);
        verify(mediaStub, never()).withDeadlineAfter(any(Long.class), any(TimeUnit.class));
    }

    @Test
    void shouldIgnoreBatchResultsWithBlankStorageKeyOrUrl() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);
        BatchPresignedReadUrlsResponse response = BatchPresignedReadUrlsResponse.newBuilder()
                .addResults(PresignedReadUrlResult.newBuilder()
                        .setStorageKey("user-1/avatar.webp")
                        .setPresignedUrl("https://cdn.example.com/user-1/avatar.webp")
                        .build())
                .addResults(PresignedReadUrlResult.newBuilder()
                        .setStorageKey("")
                        .setPresignedUrl("https://cdn.example.com/invalid.webp")
                        .build())
                .addResults(PresignedReadUrlResult.newBuilder()
                        .setStorageKey("user-2/avatar.webp")
                        .setPresignedUrl("")
                        .build())
                .build();

        when(mediaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getPresignedReadUrls(any())).thenReturn(response);

        Map<String, String> result = adapter.getPresignedReadUrls(List.of("user-1/avatar.webp", "user-2/avatar.webp"));

        assertEquals(Map.of("user-1/avatar.webp", "https://cdn.example.com/user-1/avatar.webp"), result);
    }

    @Test
    void shouldReturnEmptyMapWhenBatchRequestFails() {
        MediaGrpcClientAdapter adapter = new MediaGrpcClientAdapter(mediaStub);

        when(mediaStub.withDeadlineAfter(5, TimeUnit.SECONDS)).thenReturn(deadlineStub);
        when(deadlineStub.getPresignedReadUrls(any()))
                .thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        Map<String, String> result = adapter.getPresignedReadUrls(List.of("user-1/avatar.webp"));

        assertEquals(Map.of(), result);
    }
}
