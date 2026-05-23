package com.healthcore.notification_service.application.port;

public interface NotificationIdempotencyStore {

    Registration register(String key);

    void markSucceeded(String key);

    void release(String key);

    enum Registration {
        ACQUIRED,
        ALREADY_SUCCEEDED,
        IN_PROGRESS
    }
}
