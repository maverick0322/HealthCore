package com.healthcore.notification_service.infrastructure.email;

import com.healthcore.notification_service.application.port.EmailSender;
import com.healthcore.notification_service.domain.model.EmailMessage;
import com.healthcore.notification_service.infrastructure.config.ResendProperties;

import java.util.List;
import java.util.Objects;

public class ResendEmailSender implements EmailSender {

    private final ResendEmailClient resendEmailClient;
    private final ResendProperties resendProperties;

    public ResendEmailSender(ResendEmailClient resendEmailClient, ResendProperties resendProperties) {
        this.resendEmailClient = resendEmailClient;
        this.resendProperties = resendProperties;
    }

    @Override
    public void send(EmailMessage message) {
        validate(message);

        ResendEmailRequest request = new ResendEmailRequest(
                formatFromAddress(),
                List.of(message.toEmail()),
                message.subject(),
                message.htmlBody(),
                message.textBody()
        );

        resendEmailClient.sendEmail(request);
    }

    private String formatFromAddress() {
        return String.format("%s <%s>", resendProperties.fromName(), resendProperties.fromEmail());
    }

    private void validate(EmailMessage message) {
        Objects.requireNonNull(message, "message must not be null");
        if (message.toEmail() == null || message.toEmail().isBlank()) {
            throw new IllegalArgumentException("toEmail must not be blank");
        }
        if (message.subject() == null || message.subject().isBlank()) {
            throw new IllegalArgumentException("subject must not be blank");
        }
        if (message.htmlBody() == null || message.htmlBody().isBlank()) {
            throw new IllegalArgumentException("htmlBody must not be blank");
        }
    }

}
