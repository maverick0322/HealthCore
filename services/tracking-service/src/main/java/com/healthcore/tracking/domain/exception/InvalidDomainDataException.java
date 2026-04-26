package com.healthcore.tracking.domain.exception;

public class InvalidDomainDataException extends TrackingDomainException {
    public InvalidDomainDataException(String message) {
        super(message);
    }
}