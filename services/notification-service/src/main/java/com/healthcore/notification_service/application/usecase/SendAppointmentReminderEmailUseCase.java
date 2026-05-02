package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.port.UserDirectoryPort;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.AppointmentReminderEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

public class SendAppointmentReminderEmailUseCase {

    private final EmailSender emailSender;
    private final UserDirectoryPort userDirectoryPort;
    private final TemplateService templateService;

    public SendAppointmentReminderEmailUseCase(EmailSender emailSender, UserDirectoryPort userDirectoryPort, TemplateService templateService) {
        this.emailSender = emailSender;
        this.userDirectoryPort = userDirectoryPort;
        this.templateService = templateService;
    }

    public void send(AppointmentReminderEvent event) {
        validate(event);

        Map<String, String> emailByUserId = userDirectoryPort.getEmailsByUserIds(List.of(event.patientId(), event.nutritionistId()));
        String patientEmail = emailByUserId.get(event.patientId());
        String nutritionistEmail = emailByUserId.get(event.nutritionistId());

        Locale locale = templateService.getLocale(event.locale());
        String subject = templateService.getMessage("appointment.reminder.subject", locale);
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("startTime", event.startTime());

        String htmlBody = templateService.render("appointment-reminder", variables, locale);
        String textBody = templateService.getMessage("appointment.reminder.text", locale, event.startTime());

        sendIfPresent(patientEmail, subject, htmlBody, textBody);
        sendIfPresent(nutritionistEmail, subject, htmlBody, textBody);
    }

    private void sendIfPresent(String email, String subject, String htmlBody, String textBody) {
        if (email == null || email.isBlank()) {
            return;
        }
        emailSender.send(new EmailMessage(email, subject, htmlBody, textBody));
    }

    private void validate(AppointmentReminderEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        EventValidation.requireNonBlank(event.appointmentId(), "appointmentId");
        EventValidation.requireNonBlank(event.patientId(), "patientId");
        EventValidation.requireNonBlank(event.nutritionistId(), "nutritionistId");
    }
}
