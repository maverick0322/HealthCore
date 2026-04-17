package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;

public record AuthTokensResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresInMs,
        long refreshTokenExpiresInMs
) {
    public static AuthTokensResponse from(AuthService.AuthTokens tokens) {
        return new AuthTokensResponse(
                tokens.accessToken(),
                tokens.refreshToken(),
                tokens.tokenType(),
                tokens.accessTokenExpiresInMs(),
                tokens.refreshTokenExpiresInMs()
        );
    }
}

