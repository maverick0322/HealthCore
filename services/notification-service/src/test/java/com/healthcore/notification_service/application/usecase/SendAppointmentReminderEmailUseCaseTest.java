package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.domain.events.AppointmentReminderEvent;
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

class SendAppointmentReminderEmailUseCaseTest {

    @Test
    void sendSkipsMissingEmails() {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        UserDirectoryPort userDirectoryPort = Mockito.mock(UserDirectoryPort.class);
        Mockito.when(userDirectoryPort.getEmailsByUserIds(List.of("patient-1", "nutri-1")))
                .thenReturn(Map.of("nutri-1", "nutri@healthcore.com"));

        SendAppointmentReminderEmailUseCase useCase = new SendAppointmentReminderEmailUseCase(emailSender, userDirectoryPort);

        useCase.send(new AppointmentReminderEvent(
                "appt-1",
                "patient-1",
                "nutri-1",
                "2026-04-30T10:00:00Z",
                "2026-04-30T10:30:00Z"
        ));

        assertEquals(1, emailSender.messages.size());
        EmailMessage message = emailSender.messages.get(0);
        assertEquals("nutri@healthcore.com", message.toEmail());
        assertEquals("Appointment reminder", message.subject());
        assertTrue(message.htmlBody().contains("2026-04-30T10:00:00Z"));
        assertTrue(message.textBody().contains("2026-04-30T10:30:00Z"));
    }

    @ParameterizedTest
    @CsvSource({
            "2026-04-30T10:00:00Z,2026-04-30T10:00:00Z",
            "2026-04-30T11:00:00Z,2026-04-30T10:00:00Z"
    })
    void sendRejectsInvalidTimeRange(String startTime, String endTime) {
        CapturingEmailSender emailSender = new CapturingEmailSender();
        UserDirectoryPort userDirectoryPort = Mockito.mock(UserDirectoryPort.class);
        SendAppointmentReminderEmailUseCase useCase = new SendAppointmentReminderEmailUseCase(emailSender, userDirectoryPort);

        AppointmentReminderEvent event = new AppointmentReminderEvent(
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
