package com.healthcore.tracking.domain.exception;

public class ClinicalServiceUnavailableException extends TrackingDomainException {
    public ClinicalServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
