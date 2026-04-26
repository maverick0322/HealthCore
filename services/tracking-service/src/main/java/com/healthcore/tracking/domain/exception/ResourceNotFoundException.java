package com.healthcore.tracking.domain.exception;

public class ResourceNotFoundException extends TrackingDomainException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}