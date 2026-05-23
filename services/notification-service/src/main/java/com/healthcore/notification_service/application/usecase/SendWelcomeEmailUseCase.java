package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.time.Clock;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
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
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("verificationRequired", event.emailVerificationRequired());
        variables.put("verificationCode", event.verificationCode());
        variables.put("verificationExpiresAt", event.verificationExpiresAt());

        String htmlBody = templateService.render("welcome", variables, locale);
        String textBody = buildTextBody(event, locale);

        emailSender.send(new EmailMessage(event.email(), subject, htmlBody, textBody, idempotencyKey(event)));
    }

    private void validate(UserRegisteredEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        EventValidation.requireEmail(event.email(), "event email");
        if (event.emailVerificationRequired()) {
            EventValidation.requireNonBlank(event.verificationCode(), "verification code");
            EventValidation.requireFutureInstant(event.verificationExpiresAt(), "verification expiration", clock);
        }
    }

    private String buildTextBody(UserRegisteredEvent event, Locale locale) {
        if (event.emailVerificationRequired()) {
            return templateService.getMessage("welcome.verification.text", locale, 
                event.verificationCode(), event.verificationExpiresAt());
        }
        return templateService.getMessage("welcome.ready.text", locale);
    }

    private String idempotencyKey(UserRegisteredEvent event) {
        String userKey = event.userId();
        if (userKey == null || userKey.isBlank()) {
            userKey = Integer.toHexString(Objects.hash(event.email(), event.registeredAt()));
        }
        return "welcome:" + userKey.trim();
    }
}
