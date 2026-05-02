package com.healthcore.notification_service.domain.events;

public record PasswordResetRequestedEvent(
        String email,
        String resetCode,
        String expiresAt,
        String locale
) {
}
