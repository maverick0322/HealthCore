package com.healthcore.notification_service.domain.model;

public record EmailMessage(
        String toEmail,
        String subject,
        String htmlBody,
        String textBody
) {
}
