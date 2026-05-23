package com.healthcore.media.interfaces.rest;

import com.healthcore.media.domain.exception.MediaDomainException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Centralized exception routing.
 * Translates low-level or domain exceptions into standardized, safe HTTP responses.
 * Prevents stack trace leakage.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ApiErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String message
    ) {}

    /**
     * Handles DTO validation failures (@Valid).
     * Extracts specific field errors for client-side correction.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(" "));

        log.warn("Payload validation failed: {}", errorMessage);
        return buildResponse(HttpStatus.BAD_REQUEST, errorMessage);
    }

    /**
     * Handles invalid arguments passed to Use Cases or Domain logic.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Illegal argument provided: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    /**
     * Handles custom business rule violations for the Media Domain.
     */
    @ExceptionHandler(MediaDomainException.class)
    public ResponseEntity<ApiErrorResponse> handleMediaDomainException(MediaDomainException ex) {
        log.error("Media domain operation failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    /**
     * Handles 404 Routing errors gracefully instead of defaulting to 500 Internal Error.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFoundException(NoResourceFoundException ex) {
        log.warn("Attempt to access non-existent route or resource: {}", ex.getResourcePath());
        return buildResponse(HttpStatus.NOT_FOUND, "The requested endpoint or resource does not exist.");
    }

    /**
     * Ultimate fallback. Captures database drops, NullPointers, and network timeouts.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneralError(Exception ex) {
        log.error("Critical unhandled internal server error.", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected internal error occurred in the Media Service. Please try again later.");
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(HttpStatus status, String message) {
        ApiErrorResponse errorPayload = new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message
        );
        return ResponseEntity.status(status).body(errorPayload);
    }
}