package com.healthcore.media.application.usecase;

import com.healthcore.media.application.dto.UploadMediaResponse;
import com.healthcore.media.domain.exception.MediaDomainException;
import com.healthcore.media.domain.port.MediaStoragePort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.core.exception.SdkClientException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GenerateUploadUrlUseCase.
 * Validates domain rules, unique key generation, and defensive exception handling.
 */
@ExtendWith(MockitoExtension.class)
class GenerateUploadUrlUseCaseTest {

    @Mock
    private MediaStoragePort mediaStoragePort;

    @InjectMocks
    private GenerateUploadUrlUseCase useCase;

    private static final String VALID_USER_ID = "usr-dev-999";
    private static final String VALID_FILE_NAME = "xray-scan.png";
    private static final String MOCK_PRESIGNED_URL = "https://mock.r2.cloudflarestorage.com/token";

    @Test
    void execute_WithValidParameters_ReturnsResponseWithGeneratedUrlAndSecureKey() {
        // Arrange
        when(mediaStoragePort.generateUploadUrl(anyString())).thenReturn(MOCK_PRESIGNED_URL);

        // Act
        UploadMediaResponse response = useCase.execute(VALID_USER_ID, VALID_FILE_NAME);

        // Assert
        assertThat(response.presignedUrl()).isEqualTo(MOCK_PRESIGNED_URL);

        // Verifies the key encapsulates the user ID and original file name, preventing path traversal
        assertThat(response.storageKey())
                .startsWith(VALID_USER_ID + "/")
                .endsWith("-" + VALID_FILE_NAME);

        // Verifies the port was called with the exact generated secure key
        verify(mediaStoragePort).generateUploadUrl(response.storageKey());
    }

    @Test
    void execute_WhenUserIdIsNull_ThrowsIllegalArgumentException() {
        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(null, VALID_FILE_NAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El identificador del usuario es requerido.");
    }

    @Test
    void execute_WhenUserIdIsBlank_ThrowsIllegalArgumentException() {
        // Act & Assert
        assertThatThrownBy(() -> useCase.execute("   ", VALID_FILE_NAME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El identificador del usuario es requerido.");
    }

    @Test
    void execute_WhenPortThrowsIllegalArgumentException_WrapsInMediaDomainException() {
        // Arrange
        when(mediaStoragePort.generateUploadUrl(anyString()))
                .thenThrow(new IllegalArgumentException("Invalid S3 parameters"));

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(VALID_USER_ID, VALID_FILE_NAME))
                .isInstanceOf(MediaDomainException.class)
                .hasMessage("Error en los parámetros de la solicitud de almacenamiento.");
    }

    @Test
    void execute_WhenPortThrowsSdkException_WrapsInMediaDomainException() {
        // Arrange
        // Using SdkClientException as a concrete implementation of the abstract SdkException
        SdkClientException sdkException = SdkClientException.builder().message("Network timeout").build();
        when(mediaStoragePort.generateUploadUrl(anyString())).thenThrow(sdkException);

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(VALID_USER_ID, VALID_FILE_NAME))
                .isInstanceOf(MediaDomainException.class)
                .hasMessage("El servicio de almacenamiento externo no está disponible.");
    }

    @Test
    void execute_WhenPortThrowsGenericException_WrapsInMediaDomainException() {
        // Arrange
        when(mediaStoragePort.generateUploadUrl(anyString()))
                .thenThrow(new RuntimeException("Unexpected memory error"));

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(VALID_USER_ID, VALID_FILE_NAME))
                .isInstanceOf(MediaDomainException.class)
                .hasMessage("Ocurrió un error crítico procesando la solicitud de medios.");
    }
}