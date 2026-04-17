package com.healthcore.identity.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetCode {
    private String id;
    private String userId;
    private String email;
    private String codeHash;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}

