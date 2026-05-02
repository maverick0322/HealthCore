package com.healthcore.identity.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String email;
    private String passwordHash;
    private Role role;
    private AuthProvider provider;
    private boolean emailVerified;
    private Instant verifiedAt;
    private boolean enabled;
    private Instant createdAt;
}
