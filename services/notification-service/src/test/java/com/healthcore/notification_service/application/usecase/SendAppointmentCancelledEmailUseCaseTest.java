package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.domain.events.AppointmentCancelledEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SendAppointmentCancelledEmailUseCaseTest {

    private TemplateService templateService;
    private CapturingEmailSender emailSender;
    private UserDirectoryPort userDirectoryPort;
    private SendAppointmentCancelledEmailUseCase useCase;

    @BeforeEach
    void setUp() {
        templateService = mock(TemplateService.class);
        emailSender = new CapturingEmailSender();
        userDirectoryPort = mock(UserDirectoryPort.class);
        useCase = new SendAppointmentCancelledEmailUseCase(emailSender, userDirectoryPort, templateService);

        when(templateService.getLocale(any())).thenReturn(Locale.of("es"));
        when(templateService.getMessage(eq("appointment.cancelled.subject"), any())).thenReturn("Cancelled Subject");
        when(userDirectoryPort.getEmailsByUserIds(any())).thenReturn(Map.of("patient-1", "patient@healthcore.com"));
    }

    @Test
    void sendSetsCorrectRecipient() {
        useCase.send(createEvent());
        assertEquals("patient@healthcore.com", emailSender.messages.get(0).toEmail());
    }

    @Test
    void sendSetsLocalizedSubject() {
        useCase.send(createEvent());
        assertEquals("Cancelled Subject", emailSender.messages.get(0).subject());
    }

    @Test
    void sendSetsLocalizedHtmlBody() {
        when(templateService.render(eq("appointment-cancelled"), any(), any())).thenReturn("html body");
        useCase.send(createEvent());
        assertEquals("html body", emailSender.messages.get(0).htmlBody());
    }

    @Test
    void sendSetsLocalizedTextBody() {
        when(templateService.getMessage(eq("appointment.cancelled.text"), any(), any(), any())).thenReturn("text body");
        useCase.send(createEvent());
        assertEquals("text body", emailSender.messages.get(0).textBody());
    }

    private AppointmentCancelledEvent createEvent() {
        return new AppointmentCancelledEvent("appt-1", "patient-1", "nutri-1", "2026-04-30T10:00:00Z", null);
    }

    private static class CapturingEmailSender implements EmailSender {
        private final List<EmailMessage> messages = new ArrayList<>();
        @Override
        public void send(EmailMessage message) {
            messages.add(message);
        }
    }
}
