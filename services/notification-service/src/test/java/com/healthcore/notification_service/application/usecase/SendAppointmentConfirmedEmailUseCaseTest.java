package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.domain.events.AppointmentConfirmedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SendAppointmentConfirmedEmailUseCaseTest {

    @Test
    void sendSendsEmailsToPatientAndNutritionist() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        UserDirectoryPort userDirectoryPort = Mockito.mock(UserDirectoryPort.class);
        Mockito.when(userDirectoryPort.getEmailsByUserIds(List.of("patient-1", "nutri-1")))
                .thenReturn(Map.of("patient-1", "patient@healthcore.com", "nutri-1", "nutri@healthcore.com"));

        SendAppointmentConfirmedEmailUseCase useCase = new SendAppointmentConfirmedEmailUseCase(emailSender, userDirectoryPort);

        useCase.send(new AppointmentConfirmedEvent(
                "appt-1",
                "patient-1",
                "nutri-1",
                "2026-04-30T10:00:00Z",
                "2026-04-30T10:30:00Z"
        ));

        assertEquals(2, emailSender.messages.size());
        EmailMessage patientMessage = emailSender.messages.stream()
                .filter(message -> message.toEmail().equals("patient@healthcore.com"))
                .findFirst()
                .orElseThrow();
        assertEquals("Appointment confirmed", patientMessage.subject());
        assertTrue(patientMessage.htmlBody().contains("2026-04-30T10:00:00Z"));
        assertTrue(patientMessage.textBody().contains("2026-04-30T10:30:00Z"));
        assertTrue(emailSender.messages.stream().anyMatch(message -> message.toEmail().equals("nutri@healthcore.com")));
    }

    @Test
    void sendSkipsMissingEmails() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        UserDirectoryPort userDirectoryPort = Mockito.mock(UserDirectoryPort.class);
        Mockito.when(userDirectoryPort.getEmailsByUserIds(List.of("patient-1", "nutri-1")))
                .thenReturn(Map.of("patient-1", "patient@healthcore.com"));

        SendAppointmentConfirmedEmailUseCase useCase = new SendAppointmentConfirmedEmailUseCase(emailSender, userDirectoryPort);

        useCase.send(new AppointmentConfirmedEvent(
                "appt-1",
                "patient-1",
                "nutri-1",
                "2026-04-30T10:00:00Z",
                "2026-04-30T10:30:00Z"
        ));

        assertEquals(1, emailSender.messages.size());
        assertEquals("patient@healthcore.com", emailSender.messages.get(0).toEmail());
    }

    @ParameterizedTest
    @CsvSource({
            "2026-04-30T10:00:00Z,2026-04-30T10:00:00Z",
            "2026-04-30T11:00:00Z,2026-04-30T10:00:00Z"
    })
    void sendRejectsInvalidTimeRange(String startTime, String endTime) {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        UserDirectoryPort userDirectoryPort = Mockito.mock(UserDirectoryPort.class);
        SendAppointmentConfirmedEmailUseCase useCase = new SendAppointmentConfirmedEmailUseCase(emailSender, userDirectoryPort);

        AppointmentConfirmedEvent event = new AppointmentConfirmedEvent(
                "appt-1",
                "patient-1",
                "nutri-1",
                startTime,
                endTime
        );

        assertThrows(IllegalArgumentException.class, () -> useCase.send(event));
    }

    private static class CapturingEmailSender implements EmailSender {

        private final List<EmailMessage> messages = new ArrayList<>();

        @Override
        public void send(EmailMessage message) {
            messages.add(message);
        }
    }
}
