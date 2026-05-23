package com.healthcore.clinical.domain.exception;

public class AgendaServiceUnavailableException extends RuntimeException {
    public AgendaServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
