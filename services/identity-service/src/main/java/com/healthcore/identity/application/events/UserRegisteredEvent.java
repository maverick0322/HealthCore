package com.healthcore.identity.application.events;

public record UserRegisteredEvent(
        String userId,
        String email,
        String role,
        String registeredAt,
        boolean emailVerificationRequired,
        String verificationCode,
        String verificationExpiresAt
) {
}
