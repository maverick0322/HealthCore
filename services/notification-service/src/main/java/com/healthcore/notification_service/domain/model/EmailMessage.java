package com.healthcore.notification_service.domain.model;

public record EmailMessage(
        String toEmail,
        String subject,
        String htmlBody,
        String textBody,
        String idempotencyKey
) {
    public EmailMessage(String toEmail, String subject, String htmlBody, String textBody) {
        this(toEmail, subject, htmlBody, textBody, null);
    }
}
