package com.healthcore.notification_service.infrastructure.email;

import java.util.List;

public record ResendEmailRequest(
        String from,
        List<String> to,
        String subject,
        String html,
        String text
) {
}
