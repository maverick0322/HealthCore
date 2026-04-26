package com.healthcore.tracking.domain.exception;

/**
 * Base exception for all Tracking Domain rule violations.
 * Allows global exception handlers to catch business errors uniformly.
 */
public abstract class TrackingDomainException extends RuntimeException {
    public TrackingDomainException(String message) {
        super(message);
    }
}