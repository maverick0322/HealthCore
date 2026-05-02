package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.time.Clock;
import java.util.Locale;
import java.util.Objects;

public class SendWelcomeEmailUseCase {

    private final EmailSender emailSender;
    private final Clock clock;
    private final TemplateService templateService;

    public SendWelcomeEmailUseCase(EmailSender emailSender, Clock clock, TemplateService templateService) {
        this.emailSender = emailSender;
        this.clock = clock;
        this.templateService = templateService;
    }

    public void send(UserRegisteredEvent event) {
        validate(event);

        Locale locale = templateService.getLocale(event.locale());
        String subject = templateService.getMessage("welcome.subject", locale);
        String htmlBody = buildHtmlBody(event, locale);
        String textBody = buildTextBody(event, locale);

        emailSender.send(new EmailMessage(event.email(), subject, htmlBody, textBody));
    }

    private void validate(UserRegisteredEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        EventValidation.requireEmail(event.email(), "event email");
        if (event.emailVerificationRequired()) {
            EventValidation.requireNonBlank(event.verificationCode(), "verification code");
            EventValidation.requireFutureInstant(event.verificationExpiresAt(), "verification expiration", clock);
        }
    }

    private String buildHtmlBody(UserRegisteredEvent event, Locale locale) {
        if (event.emailVerificationRequired()) {
            return templateService.getMessage("welcome.verification.html", locale, 
                event.verificationCode(), event.verificationExpiresAt());
        }
        return templateService.getMessage("welcome.ready.html", locale);
    }

    private String buildTextBody(UserRegisteredEvent event, Locale locale) {
        if (event.emailVerificationRequired()) {
            return templateService.getMessage("welcome.verification.text", locale, 
                event.verificationCode(), event.verificationExpiresAt());
        }
        return templateService.getMessage("welcome.ready.text", locale);
    }
}
