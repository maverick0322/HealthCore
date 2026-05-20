package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.exception.BadRequestException;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.OAuth2ProviderConflictException;
import com.healthcore.identity.domain.exception.TooManyRequestsException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.HttpMethod;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Unit tests for {@link GlobalExceptionHandler}.
 * Each handler method must map to the correct HTTP status and error code.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleUnauthorized_shouldReturn401WithCorrectCode() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleUnauthorized(new UnauthorizedException("Token expired"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).containsEntry("code", "UNAUTHORIZED");
        assertThat(response.getBody()).containsEntry("message", "Token expired");
        assertThat(response.getBody()).containsKey("timestamp");
    }

    @Test
    void handleConflict_shouldReturn409WithCorrectCode() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleConflict(new ConflictException("Email already registered"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("code", "CONFLICT");
    }

    @Test
    void handleTooManyRequests_shouldReturn429WithCorrectCode() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleTooManyRequests(new TooManyRequestsException("Rate limit exceeded"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).containsEntry("code", "TOO_MANY_REQUESTS");
    }

    @Test
    void handleBadRequest_shouldReturn400WithCorrectCode() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleBadRequest(new BadRequestException("Invalid payload"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "BAD_REQUEST");
        assertThat(response.getBody()).containsEntry("message", "Invalid payload");
    }

    @Test
    void handleValidationExceptions_shouldReturn400WithFieldErrors() {
        // MethodArgumentNotValidException requires a binding result — use mock to avoid MVC context
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        org.springframework.validation.BindingResult bindingResult =
                mock(org.springframework.validation.BindingResult.class);
        org.mockito.Mockito.when(ex.getBindingResult()).thenReturn(bindingResult);
        org.mockito.Mockito.when(bindingResult.getFieldErrors())
                .thenReturn(java.util.List.of());

        ResponseEntity<Map<String, Object>> response = handler.handleValidationExceptions(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "VALIDATION_ERROR");
        assertThat(response.getBody()).containsKey("fieldErrors");
    }

    @Test
    void handleNoResourceFound_shouldReturn404WithCorrectCode() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/api/v1/missing");

        ResponseEntity<Map<String, Object>> response = handler.handleNoResourceFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("code", "NOT_FOUND");
    }

    @Test
    void handleHttpMessageNotReadable_shouldReturn400WithCorrectCode() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);

        ResponseEntity<Map<String, Object>> response = handler.handleHttpMessageNotReadable(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "BAD_REQUEST");
    }

    @Test
    void handleHttpRequestMethodNotSupported_shouldReturn405WithCorrectCode() {
        HttpRequestMethodNotSupportedException ex =
                new HttpRequestMethodNotSupportedException("DELETE");

        ResponseEntity<Map<String, Object>> response = handler.handleHttpRequestMethodNotSupported(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(response.getBody()).containsEntry("code", "METHOD_NOT_ALLOWED");
    }

    @Test
    void handleIncorrectResultSize_shouldReturn500WithCorrectCode() {
        IncorrectResultSizeDataAccessException ex =
                new IncorrectResultSizeDataAccessException(1, 3);

        ResponseEntity<Map<String, Object>> response = handler.handleIncorrectResultSize(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsEntry("code", "DATA_INTEGRITY_ERROR");
    }

    @Test
    void handleDataAccessException_shouldReturn500WithCorrectCode() {
        // Use a concrete anonymous subclass since DataAccessException is abstract
        DataAccessException ex = new DataAccessException("db error") {};

        ResponseEntity<Map<String, Object>> response = handler.handleDataAccessException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsEntry("code", "DATABASE_ERROR");
    }

    @Test
    void handleGenericException_shouldReturn500WithCorrectCode() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleGenericException(new RuntimeException("unexpected"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsEntry("code", "INTERNAL_ERROR");
    }

    @Test
    void handleOAuth2ProviderConflict_shouldReturn409WithProviderDetails() {
        OAuth2ProviderConflictException ex = new OAuth2ProviderConflictException(
                "Email registered with different provider",
                AuthProvider.LOCAL,
                AuthProvider.AUTH0
        );

        ResponseEntity<Map<String, Object>> response = handler.handleOAuth2ProviderConflict(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("code", "OAUTH2_PROVIDER_CONFLICT");
        assertThat(response.getBody()).containsEntry("existingProvider", "LOCAL");
        assertThat(response.getBody()).containsEntry("requestedProvider", "AUTH0");
    }
}
