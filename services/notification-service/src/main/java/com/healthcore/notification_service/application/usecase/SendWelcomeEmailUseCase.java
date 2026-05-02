package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.time.Clock;
import java.util.Objects;

public class SendWelcomeEmailUseCase {

    private final EmailSender emailSender;
    private final Clock clock;

    public SendWelcomeEmailUseCase(EmailSender emailSender, Clock clock) {
        this.emailSender = emailSender;
        this.clock = clock;
    }

    public void send(UserRegisteredEvent event) {
        validate(event);

        String subject = "Welcome to HealthCore";
        String htmlBody = buildHtmlBody(event);
        String textBody = buildTextBody(event);

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

    private String buildHtmlBody(UserRegisteredEvent event) {
        if (event.emailVerificationRequired()) {
            return String.format("""
                    <p>Welcome to HealthCore!</p>
                    <p>Your verification code is: <strong>%s</strong></p>
                    <p>This code expires at %s.</p>
                    """, event.verificationCode(), event.verificationExpiresAt());
        }

        return """
                <p>Welcome to HealthCore!</p>
                <p>Your account is ready. You can sign in any time.</p>
                """;
    }

    private String buildTextBody(UserRegisteredEvent event) {
        if (event.emailVerificationRequired()) {
            return String.format(
                    "Welcome to HealthCore! Your verification code is %s. This code expires at %s.",
                    event.verificationCode(),
                    event.verificationExpiresAt()
            );
        }

        return "Welcome to HealthCore! Your account is ready. You can sign in any time.";
    }
}
