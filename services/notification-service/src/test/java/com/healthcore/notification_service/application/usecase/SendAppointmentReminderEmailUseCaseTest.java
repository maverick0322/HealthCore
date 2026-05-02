package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.domain.events.AppointmentReminderEvent;
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

class SendAppointmentReminderEmailUseCaseTest {

    private TemplateService templateService;
    private CapturingEmailSender emailSender;
    private UserDirectoryPort userDirectoryPort;
    private SendAppointmentReminderEmailUseCase useCase;

    @BeforeEach
    void setUp() {
        templateService = mock(TemplateService.class);
        emailSender = new CapturingEmailSender();
        userDirectoryPort = mock(UserDirectoryPort.class);
        useCase = new SendAppointmentReminderEmailUseCase(emailSender, userDirectoryPort, templateService);

        when(templateService.getLocale(any())).thenReturn(new Locale("es"));
        when(templateService.getMessage(eq("appointment.reminder.subject"), any())).thenReturn("Reminder Subject");
        when(userDirectoryPort.getEmailsByUserIds(any())).thenReturn(Map.of("nutri-1", "nutri@healthcore.com"));
    }

    @Test
    void sendSetsCorrectRecipient() {
        useCase.send(createEvent());
        assertEquals("nutri@healthcore.com", emailSender.messages.get(0).toEmail());
    }

    @Test
    void sendSetsLocalizedSubject() {
        useCase.send(createEvent());
        assertEquals("Reminder Subject", emailSender.messages.get(0).subject());
    }

    @Test
    void sendSetsLocalizedHtmlBody() {
        when(templateService.getMessage(eq("appointment.reminder.html"), any(), any())).thenReturn("html body");
        useCase.send(createEvent());
        assertEquals("html body", emailSender.messages.get(0).htmlBody());
    }

    @Test
    void sendSetsLocalizedTextBody() {
        when(templateService.getMessage(eq("appointment.reminder.text"), any(), any())).thenReturn("text body");
        useCase.send(createEvent());
        assertEquals("text body", emailSender.messages.get(0).textBody());
    }

    private AppointmentReminderEvent createEvent() {
        return new AppointmentReminderEvent("appt-1", "patient-1", "nutri-1", "2026-04-30T10:00:00Z", null);
    }

    private static class CapturingEmailSender implements EmailSender {
        private final List<EmailMessage> messages = new ArrayList<>();
        @Override
        public void send(EmailMessage message) {
            messages.add(message);
        }
    }
}
