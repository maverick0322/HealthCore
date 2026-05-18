package com.healthcore.tracking.infrastructure.persistence.exception;

import com.healthcore.tracking.domain.exception.TrackingDomainException;

/**
 * Infrastructure-specific exception for WaterLog database failures.
 * Extends TrackingDomainException so the GlobalExceptionHandler can catch it
 * uniformly, but lives in Infrastructure to protect Domain purity.
 */
public class WaterLogPersistenceException extends TrackingDomainException {

    public WaterLogPersistenceException(String message, Throwable cause) {
        super(message, cause);
    }
}