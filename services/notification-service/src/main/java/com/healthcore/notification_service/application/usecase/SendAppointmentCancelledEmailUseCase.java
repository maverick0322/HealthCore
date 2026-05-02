package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.AppointmentCancelledEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class SendAppointmentCancelledEmailUseCase {

    private final EmailSender emailSender;
    private final UserDirectoryPort userDirectoryPort;

    public SendAppointmentCancelledEmailUseCase(EmailSender emailSender, UserDirectoryPort userDirectoryPort) {
        this.emailSender = emailSender;
        this.userDirectoryPort = userDirectoryPort;
    }

    public void send(AppointmentCancelledEvent event) {
        validate(event);

        Map<String, String> emailByUserId = userDirectoryPort.getEmailsByUserIds(List.of(event.patientId(), event.nutritionistId()));
        String patientEmail = emailByUserId.get(event.patientId());
        String nutritionistEmail = emailByUserId.get(event.nutritionistId());

        String subject = "Appointment cancelled";
        String htmlBody = String.format("""
                <p>Your appointment was cancelled.</p>
                <p>Start: %s</p>
                <p>End: %s</p>
                """, event.startTime(), event.endTime());
        String textBody = String.format("Your appointment was cancelled. Start: %s End: %s", event.startTime(), event.endTime());

        sendIfPresent(patientEmail, subject, htmlBody, textBody);
        sendIfPresent(nutritionistEmail, subject, htmlBody, textBody);
    }

    private void sendIfPresent(String email, String subject, String htmlBody, String textBody) {
        if (email == null || email.isBlank()) {
            return;
        }
        emailSender.send(new EmailMessage(email, subject, htmlBody, textBody));
    }

    private void validate(AppointmentCancelledEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        EventValidation.requireNonBlank(event.appointmentId(), "appointmentId");
        EventValidation.requireNonBlank(event.patientId(), "patientId");
        EventValidation.requireNonBlank(event.nutritionistId(), "nutritionistId");
        EventValidation.requireStartBeforeEnd(event.startTime(), event.endTime(), "startTime", "endTime");
    }
}
