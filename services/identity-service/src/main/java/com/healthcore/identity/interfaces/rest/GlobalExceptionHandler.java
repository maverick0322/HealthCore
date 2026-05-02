package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.domain.exception.BadRequestException;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.OAuth2ProviderConflictException;
import com.healthcore.identity.domain.exception.TooManyRequestsException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorResponse("UNAUTHORIZED", ex.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildErrorResponse("CONFLICT", ex.getMessage()));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, Object>> handleTooManyRequests(TooManyRequestsException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(buildErrorResponse("TOO_MANY_REQUESTS", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = buildErrorResponse("VALIDATION_ERROR", "Validation failed");
        response.put("fieldErrors", fieldErrors);
        // Backward compatibility for existing consumers that read top-level field keys.
        response.putAll(fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFound(NoResourceFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("NOT_FOUND", "Resource not found"));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed or missing request body: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("BAD_REQUEST", "Malformed or missing request body"));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleHttpRequestMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        log.warn("HTTP method not supported: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(buildErrorResponse("METHOD_NOT_ALLOWED", "HTTP method not supported for this endpoint"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unhandled critical exception caught by GlobalExceptionHandler", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("INTERNAL_ERROR", "Internal server error. Please try again later."));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("BAD_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(OAuth2ProviderConflictException.class)
    public ResponseEntity<Map<String, Object>> handleOAuth2ProviderConflict(OAuth2ProviderConflictException ex) {
        Map<String, Object> response = buildErrorResponse("OAUTH2_PROVIDER_CONFLICT", ex.getMessage());
        response.put("existingProvider", ex.getExistingProvider().name());
        response.put("requestedProvider", ex.getRequestedProvider().name());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    private Map<String, Object> buildErrorResponse(String code, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", code);
        response.put("message", message);
        response.put("error", message);
        response.put("timestamp", OffsetDateTime.now().toString());
        return response;
    }
}