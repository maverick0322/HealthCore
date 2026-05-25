package com.healthcore.tracking.interfaces.rest;

import com.healthcore.tracking.domain.exception.ClinicalServiceUnavailableException;
import com.healthcore.tracking.domain.exception.ExternalCatalogUnavailableException;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.exception.ResourceNotFoundException;
import com.healthcore.tracking.domain.exception.TrackingDomainException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

/**
 * Global centralized exception handler for the REST layer.
 * Intercepts Domain and Infrastructure exceptions and maps them to standard HTTP status codes.
 * Ensures no stack traces or sensitive implementation details leak to the client.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Standardized error response payload.
     */
    public record ApiErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String message
    ) {}

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFoundException(ResourceNotFoundException ex) {
        log.warn("Resource not found. exceptionClass={}", ex.getClass().getSimpleName());
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InvalidDomainDataException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidDomainDataException(InvalidDomainDataException ex) {
        log.warn("Domain validation failed. exceptionClass={}", ex.getClass().getSimpleName());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ExternalCatalogUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleServiceUnavailableException(ExternalCatalogUnavailableException ex) {
        log.error("Upstream service unavailable. exceptionClass={}", ex.getClass().getSimpleName());
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    @ExceptionHandler(ClinicalServiceUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleClinicalUnavailableException(ClinicalServiceUnavailableException ex) {
        log.error("Clinical service unavailable. exceptionClass={}", ex.getClass().getSimpleName());
        return buildResponse(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied. exceptionClass={}", ex.getClass().getSimpleName());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    /**
     * Fallback for any other custom domain exception we might add in the future.
     */
    @ExceptionHandler(TrackingDomainException.class)
    public ResponseEntity<ApiErrorResponse> handleGenericDomainException(TrackingDomainException ex) {
        log.error("Unexpected domain rule violation. exceptionClass={}", ex.getClass().getSimpleName());
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    /**
     * Ultimate fallback for unhandled internal bugs (NullPointer, DB connection drops, etc.).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneralError(Exception ex) {
        // We log the full stack trace for internal debugging, but DO NOT return it.
        log.error("Critical internal server error encountered.", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected internal error occurred in the Tracking Service. Please try again later.");
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
