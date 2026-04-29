package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.domain.events.AppointmentConfirmedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class SendAppointmentConfirmedEmailUseCase {

    private final EmailSender emailSender;
    private final UserDirectoryPort userDirectoryPort;

    public SendAppointmentConfirmedEmailUseCase(EmailSender emailSender, UserDirectoryPort userDirectoryPort) {
        this.emailSender = emailSender;
        this.userDirectoryPort = userDirectoryPort;
    }

    public void send(AppointmentConfirmedEvent event) {
        validate(event);

        Map<String, String> emailByUserId = userDirectoryPort.getEmailsByUserIds(List.of(event.patientId(), event.nutritionistId()));
        String patientEmail = emailByUserId.get(event.patientId());
        String nutritionistEmail = emailByUserId.get(event.nutritionistId());

        String subject = "Appointment confirmed";
        String htmlBody = String.format("""
                <p>Your appointment is confirmed.</p>
                <p>Start: %s</p>
                <p>End: %s</p>
                """, event.startTime(), event.endTime());
        String textBody = String.format("Your appointment is confirmed. Start: %s End: %s", event.startTime(), event.endTime());

        sendIfPresent(patientEmail, subject, htmlBody, textBody);
        sendIfPresent(nutritionistEmail, subject, htmlBody, textBody);
    }

    private void sendIfPresent(String email, String subject, String htmlBody, String textBody) {
        if (email == null || email.isBlank()) {
            return;
        }
        emailSender.send(new EmailMessage(email, subject, htmlBody, textBody));
    }

    private void validate(AppointmentConfirmedEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        if (event.patientId() == null || event.patientId().isBlank()) {
            throw new IllegalArgumentException("patientId must not be blank");
        }
        if (event.nutritionistId() == null || event.nutritionistId().isBlank()) {
            throw new IllegalArgumentException("nutritionistId must not be blank");
        }
        if (event.startTime() == null || event.startTime().isBlank()) {
            throw new IllegalArgumentException("startTime must not be blank");
        }
        if (event.endTime() == null || event.endTime().isBlank()) {
            throw new IllegalArgumentException("endTime must not be blank");
        }
    }
}
