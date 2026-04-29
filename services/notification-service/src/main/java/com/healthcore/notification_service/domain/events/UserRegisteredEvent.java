package com.healthcore.notification_service.domain.events;

public record UserRegisteredEvent(
        String userId,
        String email,
        String role,
        String registeredAt
) {
}
