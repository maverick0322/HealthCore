package com.healthcore.tracking.infrastructure.persistence.exception;

import com.healthcore.tracking.domain.exception.TrackingDomainException;

/**
 * Infrastructure-specific exception for MealLog database failures.
 * Extends the abstract TrackingDomainException to allow the GlobalExceptionHandler
 * to catch it uniformly, while keeping infrastructure details out of the Domain layer.
 */
public class MealLogPersistenceException extends TrackingDomainException {

    public MealLogPersistenceException(String message, Throwable cause) {
        super(message, cause);
    }
}