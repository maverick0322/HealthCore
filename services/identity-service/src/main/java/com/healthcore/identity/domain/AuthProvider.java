package com.healthcore.identity.domain;

import com.healthcore.identity.domain.exception.UnauthorizedException;

public enum AuthProvider {
    LOCAL,
    GOOGLE,
    FACEBOOK;

    public static AuthProvider fromRegistrationId(String registrationId) {
        if (registrationId == null || registrationId.isBlank()) {
            throw new UnauthorizedException("Unsupported OAuth2 provider");
        }

        return switch (registrationId.toLowerCase()) {
            case "google" -> GOOGLE;
            case "facebook" -> FACEBOOK;
            default -> throw new UnauthorizedException("Unsupported OAuth2 provider");
        };
    }
}

