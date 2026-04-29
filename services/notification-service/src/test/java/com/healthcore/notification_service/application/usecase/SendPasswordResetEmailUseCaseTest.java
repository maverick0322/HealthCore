package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SendPasswordResetEmailUseCaseTest {

    @Test
    void sendBuildsPasswordResetEmail() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        SendPasswordResetEmailUseCase useCase = new SendPasswordResetEmailUseCase(emailSender);

        useCase.send(new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T10:15:00Z"));

        EmailMessage message = emailSender.message;
        assertNotNull(message);
        assertEquals("user@healthcore.com", message.toEmail());
        assertEquals("Your HealthCore password reset code", message.subject());
    }

    private static class CapturingEmailSender implements EmailSender {

        private EmailMessage message;

        @Override
        public void send(EmailMessage message) {
            this.message = message;
        }
    }
}
