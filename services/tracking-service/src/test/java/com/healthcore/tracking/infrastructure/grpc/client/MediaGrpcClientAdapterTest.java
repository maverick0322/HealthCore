package com.healthcore.tracking.infrastructure.grpc.client;

import com.healthcore.media.infrastructure.grpc.stubs.MediaServiceGrpcGrpc;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlRequest;
import com.healthcore.media.infrastructure.grpc.stubs.PresignedReadUrlResponse;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaGrpcClientAdapterTest {

    @Mock
    private MediaServiceGrpcGrpc.MediaServiceGrpcBlockingStub mediaStub;

    @InjectMocks
    private MediaGrpcClientAdapter adapter;

    @Test
    @DisplayName("Debe retornar null si el photoKey es null")
    void getPresignedReadUrl_WhenPhotoKeyIsNull_ReturnsNull() {
        String result = adapter.getPresignedReadUrl(null);

        assertThat(result).isNull();
        verifyNoInteractions(mediaStub);
    }

    @Test
    @DisplayName("Debe retornar null si el photoKey está vacío o en blanco")
    void getPresignedReadUrl_WhenPhotoKeyIsBlank_ReturnsNull() {
        String result = adapter.getPresignedReadUrl("   ");

        assertThat(result).isNull();
        verifyNoInteractions(mediaStub);
    }

    @Test
    @DisplayName("Debe retornar la URL pre-firmada si el gRPC responde exitosamente")
    void getPresignedReadUrl_WhenGrpcCallIsSuccessful_ReturnsUrl() {
        String expectedUrl = "https://s3.aws.com/bucket/my-photo.jpg?token=123";

        PresignedReadUrlResponse mockResponse = PresignedReadUrlResponse.newBuilder()
                .setPresignedUrl(expectedUrl)
                .setErrorMessage("")
                .build();

        when(mediaStub.getPresignedReadUrl(any(PresignedReadUrlRequest.class))).thenReturn(mockResponse);

        String result = adapter.getPresignedReadUrl("my-photo.jpg");

        assertThat(result).isEqualTo(expectedUrl);
        verify(mediaStub, times(1)).getPresignedReadUrl(any(PresignedReadUrlRequest.class));
    }

    @Test
    @DisplayName("Debe retornar null si el servicio gRPC devuelve un error controlado en el mensaje")
    void getPresignedReadUrl_WhenServiceReturnsError_ReturnsNull() {
        PresignedReadUrlResponse mockResponse = PresignedReadUrlResponse.newBuilder()
                .setErrorMessage("Key not found in S3 bucket")
                .build();

        when(mediaStub.getPresignedReadUrl(any(PresignedReadUrlRequest.class))).thenReturn(mockResponse);

        String result = adapter.getPresignedReadUrl("invalid-photo.jpg");

        assertThat(result).isNull();
        verify(mediaStub, times(1)).getPresignedReadUrl(any(PresignedReadUrlRequest.class));
    }

    @Test
    @DisplayName("Debe retornar null y manejar la excepción si el servidor gRPC está caído")
    void getPresignedReadUrl_WhenGrpcCallThrowsException_ReturnsNull() {
        // Simulamos que el microservicio de Media no está disponible (ej. contenedor apagado)
        when(mediaStub.getPresignedReadUrl(any(PresignedReadUrlRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        String result = adapter.getPresignedReadUrl("my-photo.jpg");

        assertThat(result).isNull();
        verify(mediaStub, times(1)).getPresignedReadUrl(any(PresignedReadUrlRequest.class));
    }
}