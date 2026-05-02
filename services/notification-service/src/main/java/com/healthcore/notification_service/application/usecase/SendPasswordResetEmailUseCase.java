package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.time.Clock;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

public class SendPasswordResetEmailUseCase {

    private final EmailSender emailSender;
    private final Clock clock;
    private final TemplateService templateService;

    public SendPasswordResetEmailUseCase(EmailSender emailSender, Clock clock, TemplateService templateService) {
        this.emailSender = emailSender;
        this.clock = clock;
        this.templateService = templateService;
    }

    public void send(PasswordResetRequestedEvent event) {
        validate(event);

        Locale locale = templateService.getLocale(event.locale());
        String subject = templateService.getMessage("password.reset.subject", locale);
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("resetCode", event.resetCode());
        variables.put("expiresAt", event.expiresAt());

        String htmlBody = templateService.render("password-reset", variables, locale);
        String textBody = templateService.getMessage("password.reset.text", locale, event.resetCode(), event.expiresAt());

        emailSender.send(new EmailMessage(event.email(), subject, htmlBody, textBody));
    }

    private void validate(PasswordResetRequestedEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        EventValidation.requireEmail(event.email(), "event email");
        EventValidation.requireNonBlank(event.resetCode(), "reset code");
        EventValidation.requireFutureInstant(event.expiresAt(), "expiresAt", clock);
    }
}
