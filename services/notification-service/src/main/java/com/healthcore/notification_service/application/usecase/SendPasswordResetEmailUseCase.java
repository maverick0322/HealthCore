package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.application.validation.EventValidation;
import com.healthcore.notification_service.domain.events.PasswordResetRequestedEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.time.Clock;
import java.util.Objects;

public class SendPasswordResetEmailUseCase {

    private final EmailSender emailSender;
    private final Clock clock;

    public SendPasswordResetEmailUseCase(EmailSender emailSender, Clock clock) {
        this.emailSender = emailSender;
        this.clock = clock;
    }

    public void send(PasswordResetRequestedEvent event) {
        validate(event);

        String subject = "Your HealthCore password reset code";
        String htmlBody = String.format("""
                <p>We received a password reset request.</p>
                <p>Your code is: <strong>%s</strong></p>
                <p>This code expires at %s.</p>
                """, event.resetCode(), event.expiresAt());
        String textBody = String.format(
                "We received a password reset request. Your code is %s. This code expires at %s.",
                event.resetCode(),
                event.expiresAt()
        );

        emailSender.send(new EmailMessage(event.email(), subject, htmlBody, textBody));
    }

    private void validate(PasswordResetRequestedEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        EventValidation.requireEmail(event.email(), "event email");
        EventValidation.requireNonBlank(event.resetCode(), "reset code");
        EventValidation.requireFutureInstant(event.expiresAt(), "expiresAt", clock);
    }
}
