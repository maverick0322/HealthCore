package com.healthcore.identity.domain.exception;

import com.healthcore.identity.domain.AuthProvider;

public class OAuth2ProviderConflictException extends ConflictException {

    private final AuthProvider existingProvider;
    private final AuthProvider requestedProvider;

    public OAuth2ProviderConflictException(String message, AuthProvider existingProvider, AuthProvider requestedProvider) {
        super(message);
        this.existingProvider = existingProvider;
        this.requestedProvider = requestedProvider;
    }

    public AuthProvider getExistingProvider() {
        return existingProvider;
    }

    public AuthProvider getRequestedProvider() {
        return requestedProvider;
    }
}

