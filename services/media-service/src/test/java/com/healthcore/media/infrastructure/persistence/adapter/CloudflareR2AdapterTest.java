package com.healthcore.media.infrastructure.persistence.adapter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.net.URL;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CloudflareR2Adapter.
 * Verifies the correct construction of S3 presigned requests and error propagation.
 */
@ExtendWith(MockitoExtension.class)
class CloudflareR2AdapterTest {

    @Mock
    private S3Presigner s3Presigner;

    @InjectMocks
    private CloudflareR2Adapter adapter;

    @Captor
    private ArgumentCaptor<PutObjectPresignRequest> presignRequestCaptor;

    private static final String MOCK_BUCKET_NAME = "healthcore-media-test";
    private static final String TARGET_FILE_NAME = "user-123/avatar.png";
    private static final String EXPECTED_URL = "https://mock.r2.cloudflarestorage.com/signature";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(adapter, "bucketName", MOCK_BUCKET_NAME);
    }

    @Test
    void generateUploadUrl_WithValidFileName_ReturnsPresignedUrlString() throws Exception {
        // Arrange
        PresignedPutObjectRequest mockedPresignedRequest = mock(PresignedPutObjectRequest.class);
        URL mockUrl = URI.create(EXPECTED_URL).toURL();

        when(mockedPresignedRequest.url()).thenReturn(mockUrl);
        when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(mockedPresignedRequest);

        // Act
        String actualUrl = adapter.generateUploadUrl(TARGET_FILE_NAME);

        // Assert
        assertThat(actualUrl).isEqualTo(EXPECTED_URL);

        // Verify the internal state of the request sent to the AWS SDK
        verify(s3Presigner).presignPutObject(presignRequestCaptor.capture());
        PutObjectPresignRequest capturedRequest = presignRequestCaptor.getValue();

        assertThat(capturedRequest.signatureDuration())
                .as("Signature duration must be exactly 5 minutes")
                .isEqualTo(Duration.ofMinutes(5));

        assertThat(capturedRequest.putObjectRequest().bucket())
                .as("Target bucket must match the injected configuration")
                .isEqualTo(MOCK_BUCKET_NAME);

        assertThat(capturedRequest.putObjectRequest().key())
                .as("Target file key must match the requested file name")
                .isEqualTo(TARGET_FILE_NAME);
    }

    @Test
    void generateUploadUrl_WhenS3PresignerThrowsException_PropagatesException() {
        // Arrange
        SdkClientException sdkException = SdkClientException.builder().message("Network failure").build();
        when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenThrow(sdkException);

        // Act & Assert
        assertThatThrownBy(() -> adapter.generateUploadUrl(TARGET_FILE_NAME))
                .isInstanceOf(SdkClientException.class)
                .hasMessageContaining("Network failure");
    }

    @Test
    void generateUploadUrl_WhenFileNameIsNull_ThrowsNullPointerException() {
        // Act & Assert
        assertThatThrownBy(() -> adapter.generateUploadUrl(null))
                .isInstanceOf(NullPointerException.class);
    }
}