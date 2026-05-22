package com.healthcore.media.interfaces.rest;

import com.healthcore.media.domain.exception.MediaDomainException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GlobalExceptionHandler.
 * Ensures all domain and infrastructure exceptions map to the correct HTTP status
 * and safe JSON structures without exposing internal stack traces.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleValidationExceptions_WithMultipleErrors_ReturnsBadRequestAndConcatenatedMessages() {
        // Arrange
        MethodArgumentNotValidException mockException = mock(MethodArgumentNotValidException.class);
        BindingResult mockBindingResult = mock(BindingResult.class);

        FieldError fieldError1 = new FieldError("uploadRequest", "fileName", "Cannot be blank.");
        FieldError fieldError2 = new FieldError("uploadRequest", "fileName", "Invalid format.");

        when(mockBindingResult.getFieldErrors()).thenReturn(List.of(fieldError1, fieldError2));
        when(mockException.getBindingResult()).thenReturn(mockBindingResult);

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response =
                exceptionHandler.handleValidationExceptions(mockException);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().error()).isEqualTo("Bad Request");
        assertThat(response.getBody().message()).isEqualTo("Cannot be blank. Invalid format.");
    }

    @Test
    void handleIllegalArgumentException_ReturnsBadRequest() {
        // Arrange
        String errorMessage = "Invalid user identifier.";
        IllegalArgumentException exception = new IllegalArgumentException(errorMessage);

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response =
                exceptionHandler.handleIllegalArgumentException(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo(errorMessage);
    }

    @Test
    void handleMediaDomainException_ReturnsUnprocessableEntity() {
        // Arrange
        String errorMessage = "External storage provider is offline.";
        MediaDomainException exception = new MediaDomainException(errorMessage);

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response =
                exceptionHandler.handleMediaDomainException(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(422);
        assertThat(response.getBody().error()).isEqualTo("Unprocessable Entity");
        assertThat(response.getBody().message()).isEqualTo(errorMessage);
    }

    @Test
    void handleNoResourceFoundException_ReturnsNotFoundWithGenericMessage() {
        // Arrange
        NoResourceFoundException exception = new NoResourceFoundException(HttpMethod.GET, "/api/v1/invalid");

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response =
                exceptionHandler.handleNoResourceFoundException(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().error()).isEqualTo("Not Found");
        assertThat(response.getBody().message()).isEqualTo("The requested endpoint or resource does not exist.");
    }

    @Test
    void handleGeneralError_ReturnsInternalServerErrorWithStaticSafeMessage() {
        // Arrange
        Exception exception = new NullPointerException("Hidden internal error");

        // Act
        ResponseEntity<GlobalExceptionHandler.ApiErrorResponse> response =
                exceptionHandler.handleGeneralError(exception);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(500);
        assertThat(response.getBody().error()).isEqualTo("Internal Server Error");
        assertThat(response.getBody().message())
                .isEqualTo("An unexpected internal error occurred in the Media Service. Please try again later.");
    }
}