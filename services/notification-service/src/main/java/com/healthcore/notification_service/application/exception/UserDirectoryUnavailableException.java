package com.healthcore.notification_service.application.exception;

public class UserDirectoryUnavailableException extends RuntimeException {

    public UserDirectoryUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
