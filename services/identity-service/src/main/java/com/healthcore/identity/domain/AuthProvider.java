package com.healthcore.identity.domain;

import com.healthcore.identity.domain.exception.UnauthorizedException;

public enum AuthProvider {
    LOCAL,
    AUTH0;

    public static AuthProvider fromRegistrationId(String registrationId) {
        if (registrationId == null || registrationId.isBlank()) {
            throw new UnauthorizedException("Unsupported OAuth2 provider");
        }

        if (registrationId.equalsIgnoreCase("auth0")) {
            return AUTH0;
        }else {
            throw new UnauthorizedException("Unsupported OAuth2 provider");
        }
    }
}

