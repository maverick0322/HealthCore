package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.Role;

public record CurrentUserResponse(
        String email,
        Role role,
        AuthProvider provider,
        boolean emailVerified,
        boolean enabled
) {
}

