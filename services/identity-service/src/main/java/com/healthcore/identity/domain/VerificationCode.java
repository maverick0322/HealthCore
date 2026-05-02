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
public class VerificationCode {
    private String id;
    private String userId;
    private String email;
    private String codeHash;
    private Instant expiresAt;
    private Instant createdAt;
}
