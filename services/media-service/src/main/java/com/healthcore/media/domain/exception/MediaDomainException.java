package com.healthcore.media.domain.exception;

/**
 * Base runtime exception for all domain-specific business rule violations
 * within the Media Service. Ensures that internal infrastructure errors
 * can be wrapped and safely handled without leaking stack traces.
 */
public class MediaDomainException extends RuntimeException {

    public MediaDomainException(String message) {
        super(message);
    }

    public MediaDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}