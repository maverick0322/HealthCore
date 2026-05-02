package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.domain.events.AppointmentConfirmedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SendAppointmentConfirmedEmailUseCaseTest {

    private TemplateService templateService;
    private CapturingEmailSender emailSender;
    private UserDirectoryPort userDirectoryPort;
    private SendAppointmentConfirmedEmailUseCase useCase;

    @BeforeEach
    void setUp() {
        templateService = mock(TemplateService.class);
        emailSender = new CapturingEmailSender();
        userDirectoryPort = mock(UserDirectoryPort.class);
        useCase = new SendAppointmentConfirmedEmailUseCase(emailSender, userDirectoryPort, templateService);

        when(templateService.getLocale(any())).thenReturn(Locale.of("es"));
        when(templateService.getMessage(eq("appointment.confirmed.subject"), any())).thenReturn("Confirmed Subject");
        when(userDirectoryPort.getEmailsByUserIds(any())).thenReturn(Map.of(
                "patient-1", "patient@healthcore.com",
                "nutri-1", "nutri@healthcore.com"
        ));
    }

    @Test
    void sendSendsEmailsToBothRecipients() {
        useCase.send(createEvent());
        assertEquals(2, emailSender.messages.size());
    }

    @Test
    void sendSetsCorrectPatientRecipient() {
        useCase.send(createEvent());
        boolean hasPatient = emailSender.messages.stream().anyMatch(m -> m.toEmail().equals("patient@healthcore.com"));
        assertEquals(true, hasPatient);
    }

    @Test
    void sendSetsCorrectNutritionistRecipient() {
        useCase.send(createEvent());
        boolean hasNutri = emailSender.messages.stream().anyMatch(m -> m.toEmail().equals("nutri@healthcore.com"));
        assertEquals(true, hasNutri);
    }

    @Test
    void sendSetsLocalizedSubject() {
        useCase.send(createEvent());
        assertEquals("Confirmed Subject", emailSender.messages.get(0).subject());
    }

    @Test
    void sendSetsLocalizedHtmlBody() {
        when(templateService.render(eq("appointment-confirmed"), any(), any())).thenReturn("html body");
        useCase.send(createEvent());
        assertEquals("html body", emailSender.messages.get(0).htmlBody());
    }

    @Test
    void sendSetsLocalizedTextBody() {
        when(templateService.getMessage(eq("appointment.confirmed.text"), any(), any(), any())).thenReturn("text body");
        useCase.send(createEvent());
        assertEquals("text body", emailSender.messages.get(0).textBody());
    }

    @Test
    void sendSkipsMissingEmails() {
        when(userDirectoryPort.getEmailsByUserIds(any())).thenReturn(Map.of("patient-1", "patient@healthcore.com"));
        useCase.send(createEvent());
        assertEquals(1, emailSender.messages.size());
    }

    @Test
    void sendRejectsInvalidTimeRange() {
        AppointmentConfirmedEvent event = new AppointmentConfirmedEvent(
                "appt-1", "patient-1", "nutri-1", "2026-04-30T11:00:00Z", "2026-04-30T10:00:00Z", null
        );
        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    private AppointmentConfirmedEvent createEvent() {
        return new AppointmentConfirmedEvent(
                "appt-1", "patient-1", "nutri-1", "2026-04-30T10:00:00Z", "2026-04-30T10:30:00Z", null
        );
    }

    private static class CapturingEmailSender implements EmailSender {
        private final List<EmailMessage> messages = new ArrayList<>();
        @Override
        public void send(EmailMessage message) {
            messages.add(message);
        }
    }
}
