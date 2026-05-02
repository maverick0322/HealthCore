package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
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

class SendWelcomeEmailUseCaseTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-04-28T09:00:00Z"), ZoneOffset.UTC);

    @Test
    void sendBuildsWelcomeEmailWithVerificationCode() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        SendWelcomeEmailUseCase useCase = new SendWelcomeEmailUseCase(emailSender, FIXED_CLOCK);

        useCase.send(new UserRegisteredEvent(
                "user-123",
                "user@healthcore.com",
                "PATIENT",
                "2026-04-28T10:00:00Z",
                true,
                "123456",
                "2026-04-28T10:15:00Z"
        ));

        EmailMessage message = emailSender.message;
        assertNotNull(message);
        assertEquals("user@healthcore.com", message.toEmail());
        assertEquals("Welcome to HealthCore", message.subject());
        assertTrue(message.htmlBody().contains("123456"));
        assertTrue(message.textBody().contains("123456"));
    }

    @Test
    void sendBuildsWelcomeEmailForSocialUser() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        SendWelcomeEmailUseCase useCase = new SendWelcomeEmailUseCase(emailSender, FIXED_CLOCK);

        useCase.send(new UserRegisteredEvent(
                "user-456",
                "social@healthcore.com",
                "PATIENT",
                "2026-04-28T10:00:00Z",
                false,
                null,
                null
        ));

        EmailMessage message = emailSender.message;
        assertNotNull(message);
        assertEquals("social@healthcore.com", message.toEmail());
        assertEquals("Welcome to HealthCore", message.subject());
        assertTrue(message.htmlBody().contains("Your account is ready"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "invalid", "user@", "user@domain"})
    void sendRejectsInvalidEmail(String email) {
        SendWelcomeEmailUseCase useCase = new SendWelcomeEmailUseCase(new CapturingEmailSender(), FIXED_CLOCK);

        UserRegisteredEvent event = new UserRegisteredEvent(
                "user-789",
                email,
                "PATIENT",
                "2026-04-28T10:00:00Z",
                false,
                null,
                null
        );

        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    @Test
    void sendRejectsExpiredVerificationCode() {
        SendWelcomeEmailUseCase useCase = new SendWelcomeEmailUseCase(new CapturingEmailSender(), FIXED_CLOCK);

        UserRegisteredEvent event = new UserRegisteredEvent(
                "user-999",
                "user@healthcore.com",
                "PATIENT",
                "2026-04-28T10:00:00Z",
                true,
                "123456",
                "2026-04-28T08:00:00Z"
        );

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
