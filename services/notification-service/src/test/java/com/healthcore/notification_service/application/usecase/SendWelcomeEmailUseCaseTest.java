package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SendWelcomeEmailUseCaseTest {

    @Test
    void sendBuildsWelcomeEmailWithVerificationCode() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        SendWelcomeEmailUseCase useCase = new SendWelcomeEmailUseCase(emailSender);

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
    }

    @Test
    void sendBuildsWelcomeEmailForSocialUser() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        SendWelcomeEmailUseCase useCase = new SendWelcomeEmailUseCase(emailSender);

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
    }

    private static class CapturingEmailSender implements EmailSender {

        private EmailMessage message;

        @Override
        public void send(EmailMessage message) {
            this.message = message;
        }
    }
}
