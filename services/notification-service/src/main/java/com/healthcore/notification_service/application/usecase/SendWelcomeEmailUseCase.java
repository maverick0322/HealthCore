package com.healthcore.notification_service.application.usecase;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.events.UserRegisteredEvent;
import com.healthcore.notification_service.domain.model.EmailMessage;

import java.util.Objects;

public class SendWelcomeEmailUseCase {

    private final EmailSender emailSender;

    public SendWelcomeEmailUseCase(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    public void send(UserRegisteredEvent event) {
        validate(event);

        String subject = "Welcome to HealthCore";
        String htmlBody = """
                <p>Welcome to HealthCore!</p>
                <p>Your account is ready. You can sign in any time.</p>
                """;
        String textBody = "Welcome to HealthCore! Your account is ready. You can sign in any time.";

        emailSender.send(new EmailMessage(event.email(), subject, htmlBody, textBody));
    }

    private void validate(UserRegisteredEvent event) {
        Objects.requireNonNull(event, "event must not be null");
        if (event.email() == null || event.email().isBlank()) {
            throw new IllegalArgumentException("event email must not be blank");
        }
    }
}
