package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SendWelcomeEmailUseCaseTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-04-28T09:00:00Z"), ZoneOffset.UTC);
    private TemplateService templateService;
    private CapturingEmailSender emailSender;
    private SendWelcomeEmailUseCase useCase;

    @BeforeEach
    void setUp() {
        templateService = mock(TemplateService.class);
        emailSender = new CapturingEmailSender();
        useCase = new SendWelcomeEmailUseCase(emailSender, FIXED_CLOCK, templateService);
        
        when(templateService.getLocale(any())).thenReturn(Locale.of("es"));
        when(templateService.getMessage(eq("welcome.subject"), any())).thenReturn("Welcome to HealthCore");
    }

    @Test
    void sendSetsCorrectRecipient() {
        useCase.send(createVerificationEvent());
        assertEquals("user@healthcore.com", emailSender.message.toEmail());
    }

    @Test
    void sendSetsLocalizedSubject() {
        useCase.send(createVerificationEvent());
        assertEquals("Welcome to HealthCore", emailSender.message.subject());
    }

    @Test
    void sendSetsLocalizedHtmlBodyForVerification() {
        when(templateService.getMessage(eq("welcome.verification.html"), any(), any(), any())).thenReturn("html 123456");
        useCase.send(createVerificationEvent());
        assertEquals("html 123456", emailSender.message.htmlBody());
    }

    @Test
    void sendSetsLocalizedTextBodyForVerification() {
        when(templateService.getMessage(eq("welcome.verification.text"), any(), any(), any())).thenReturn("text 123456");
        useCase.send(createVerificationEvent());
        assertEquals("text 123456", emailSender.message.textBody());
    }

    @Test
    void sendSetsLocalizedHtmlBodyForSocialUser() {
        when(templateService.getMessage(eq("welcome.ready.html"), any())).thenReturn("Your account is ready html");
        useCase.send(createSocialEvent());
        assertEquals("Your account is ready html", emailSender.message.htmlBody());
    }

    @Test
    void sendSetsLocalizedTextBodyForSocialUser() {
        when(templateService.getMessage(eq("welcome.ready.text"), any())).thenReturn("Your account is ready text");
        useCase.send(createSocialEvent());
        assertEquals("Your account is ready text", emailSender.message.textBody());
    }

    @Test
    void sendRejectsInvalidEmail() {
        UserRegisteredEvent event = new UserRegisteredEvent(
                "user-789", "invalid", "PATIENT", "2026-04-28T10:00:00Z", false, null, null, null
        );
        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    @Test
    void sendRejectsExpiredVerificationCode() {
        UserRegisteredEvent event = new UserRegisteredEvent(
                "user-999", "user@healthcore.com", "PATIENT", "2026-04-28T10:00:00Z", true, "123456", "2026-04-28T08:00:00Z", null
        );
        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    private UserRegisteredEvent createVerificationEvent() {
        return new UserRegisteredEvent(
                "user-123", "user@healthcore.com", "PATIENT", "2026-04-28T10:00:00Z", true, "123456", "2026-04-28T10:15:00Z", null
        );
    }

    private UserRegisteredEvent createSocialEvent() {
        return new UserRegisteredEvent(
                "user-456", "social@healthcore.com", "PATIENT", "2026-04-28T10:00:00Z", false, null, null, null
        );
    }

    private static class CapturingEmailSender implements EmailSender {
        private EmailMessage message;
        @Override
        public void send(EmailMessage message) {
            this.message = message;
        }
    }
}
