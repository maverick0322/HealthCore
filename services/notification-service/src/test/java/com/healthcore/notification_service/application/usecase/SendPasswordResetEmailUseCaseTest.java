package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SendPasswordResetEmailUseCaseTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-04-28T09:00:00Z"), ZoneOffset.UTC);

    @Test
    void sendBuildsPasswordResetEmail() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        SendPasswordResetEmailUseCase useCase = new SendPasswordResetEmailUseCase(emailSender, FIXED_CLOCK);

        useCase.send(new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T10:15:00Z"));

        EmailMessage message = emailSender.message;
        assertNotNull(message);
        assertEquals("user@healthcore.com", message.toEmail());
        assertEquals("Your HealthCore password reset code", message.subject());
        assertTrue(message.htmlBody().contains("123456"));
        assertTrue(message.textBody().contains("123456"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "invalid", "user@", "user@domain"})
    void sendRejectsInvalidEmail(String email) {
        SendPasswordResetEmailUseCase useCase = new SendPasswordResetEmailUseCase(new CapturingEmailSender(), FIXED_CLOCK);

        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent(email, "123456", "2026-04-28T10:15:00Z");

        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    @Test
    void sendRejectsExpiredResetCode() {
        SendPasswordResetEmailUseCase useCase = new SendPasswordResetEmailUseCase(new CapturingEmailSender(), FIXED_CLOCK);

        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T08:00:00Z");

        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    private static class CapturingEmailSender implements EmailSender {

        private EmailMessage message;

        @Override
        public void send(EmailMessage message) {
            this.message = message;
        }
    }
}
