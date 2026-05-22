package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.NotificationIdempotencyStore;
import com.healthcore.notification_service.domain.model.EmailMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class IdempotentEmailSender implements EmailSender {

    private final EmailSender delegate;
    private final NotificationIdempotencyStore idempotencyStore;

    public IdempotentEmailSender(EmailSender delegate, NotificationIdempotencyStore idempotencyStore) {
        this.delegate = delegate;
        this.idempotencyStore = idempotencyStore;
    }

    @Override
    public void send(EmailMessage message) {
        String key = message.idempotencyKey();
        if (key == null || key.isBlank()) {
            delegate.send(message);
            return;
        }

        NotificationIdempotencyStore.Registration registration = idempotencyStore.register(key);
        if (registration == NotificationIdempotencyStore.Registration.ALREADY_SUCCEEDED) {
            log.info("Skipping duplicate notification delivery");
            return;
        }
        if (registration == NotificationIdempotencyStore.Registration.IN_PROGRESS) {
            throw new IllegalStateException("Notification delivery already in progress");
        }

        try {
            delegate.send(message);
            idempotencyStore.markSucceeded(key);
        } catch (RuntimeException ex) {
            idempotencyStore.release(key);
            throw ex;
        }
    }
}
