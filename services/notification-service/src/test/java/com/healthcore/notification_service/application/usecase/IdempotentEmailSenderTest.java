package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.NotificationIdempotencyStore;
import com.healthcore.notification_service.domain.model.EmailMessage;
import com.healthcore.notification_service.infrastructure.idempotency.InMemoryNotificationIdempotencyStore;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class IdempotentEmailSenderTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-04-28T09:00:00Z"), ZoneOffset.UTC);

    @Test
    void sendSkipsAlreadySuccessfulIdempotencyKey() {
        CapturingEmailSender delegate = new CapturingEmailSender();
        NotificationIdempotencyStore store = new InMemoryNotificationIdempotencyStore(
                CLOCK,
                Duration.ofHours(24),
                Duration.ofMinutes(5),
                100
        );
        IdempotentEmailSender sender = new IdempotentEmailSender(delegate, store);
        EmailMessage message = message("welcome:user-1");

        sender.send(message);
        sender.send(message);

        assertEquals(1, delegate.messages.size());
    }

    @Test
    void sendReleasesIdempotencyKeyWhenDelegateFails() {
        FailingOnceEmailSender delegate = new FailingOnceEmailSender();
        NotificationIdempotencyStore store = new InMemoryNotificationIdempotencyStore(
                CLOCK,
                Duration.ofHours(24),
                Duration.ofMinutes(5),
                100
        );
        IdempotentEmailSender sender = new IdempotentEmailSender(delegate, store);
        EmailMessage message = message("welcome:user-2");

        assertThrows(IllegalStateException.class, () -> sender.send(message));
        sender.send(message);

        assertEquals(2, delegate.attempts);
    }

    private EmailMessage message(String idempotencyKey) {
        return new EmailMessage("user@healthcore.com", "Subject", "<p>Hello</p>", "Hello", idempotencyKey);
    }

    private static class CapturingEmailSender implements EmailSender {
        private final List<EmailMessage> messages = new ArrayList<>();

        @Override
        public void send(EmailMessage message) {
            messages.add(message);
        }
    }

    private static class FailingOnceEmailSender implements EmailSender {
        private int attempts;

        @Override
        public void send(EmailMessage message) {
            attempts++;
            if (attempts == 1) {
                throw new IllegalStateException("temporary failure");
            }
        }
    }
}
