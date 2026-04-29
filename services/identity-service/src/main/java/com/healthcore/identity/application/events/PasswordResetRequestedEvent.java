package com.healthcore.identity.application.events;

public record PasswordResetRequestedEvent(
        String email,
        String resetCode,
        String expiresAt
) {
}
