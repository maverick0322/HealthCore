package com.healthcore.identity.domain;

import com.healthcore.identity.domain.exception.UnauthorizedException;

public enum AuthProvider {
    LOCAL,
    AUTH0,
    GOOGLE,
    FACEBOOK;

    public static AuthProvider fromRegistrationId(String registrationId) {
        if (registrationId == null || registrationId.isBlank()) {
            throw new UnauthorizedException("Unsupported OAuth2 provider");
        }

        return switch (registrationId.toLowerCase()) {
            case "auth0" -> AUTH0;
            default -> throw new UnauthorizedException("Unsupported OAuth2 provider");
        };
    }
}

