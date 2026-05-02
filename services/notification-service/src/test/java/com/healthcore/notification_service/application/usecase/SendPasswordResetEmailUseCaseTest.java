package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
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

class SendPasswordResetEmailUseCaseTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-04-28T09:00:00Z"), ZoneOffset.UTC);
    private TemplateService templateService;
    private CapturingEmailSender emailSender;
    private SendPasswordResetEmailUseCase useCase;

    @BeforeEach
    void setUp() {
        templateService = mock(TemplateService.class);
        emailSender = new CapturingEmailSender();
        useCase = new SendPasswordResetEmailUseCase(emailSender, FIXED_CLOCK, templateService);
        
        when(templateService.getLocale(any())).thenReturn(Locale.of("es"));
        when(templateService.getMessage(eq("password.reset.subject"), any())).thenReturn("Password Reset Subject");
    }

    @Test
    void sendSetsCorrectRecipient() {
        useCase.send(createEvent());
        assertEquals("user@healthcore.com", emailSender.message.toEmail());
    }

    @Test
    void sendSetsLocalizedSubject() {
        useCase.send(createEvent());
        assertEquals("Password Reset Subject", emailSender.message.subject());
    }

    @Test
    void sendSetsLocalizedHtmlBody() {
        when(templateService.render(eq("password-reset"), any(), any())).thenReturn("html 123456");
        useCase.send(createEvent());
        assertEquals("html 123456", emailSender.message.htmlBody());
    }

    @Test
    void sendSetsLocalizedTextBody() {
        when(templateService.getMessage(eq("password.reset.text"), any(), any(), any())).thenReturn("text 123456");
        useCase.send(createEvent());
        assertEquals("text 123456", emailSender.message.textBody());
    }

    @Test
    void sendRejectsInvalidEmail() {
        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent("invalid", "123456", "2026-04-28T10:15:00Z", null);
        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    @Test
    void sendRejectsExpiredResetCode() {
        PasswordResetRequestedEvent event = new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T08:00:00Z", null);
        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    private PasswordResetRequestedEvent createEvent() {
        return new PasswordResetRequestedEvent("user@healthcore.com", "123456", "2026-04-28T10:15:00Z", null);
    }

    private static class CapturingEmailSender implements EmailSender {
        private EmailMessage message;
        @Override
        public void send(EmailMessage message) {
            this.message = message;
        }
    }
}
