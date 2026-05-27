package com.healthcore.clinical.infrastructure.grpc;

import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
}
