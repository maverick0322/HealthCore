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
public class RefreshTokenOwnership {
    private String id;
    private String userId;
    private String email;
    private String tokenHash;
    private Instant expiresAt;
    private boolean revoked;
    private Instant revokedAt;
    private String replacedByTokenHash;
    private Instant createdAt;
}
