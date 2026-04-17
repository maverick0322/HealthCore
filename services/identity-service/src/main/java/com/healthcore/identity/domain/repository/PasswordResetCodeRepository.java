package com.healthcore.identity.domain.repository;

import com.healthcore.identity.domain.PasswordResetCode;

import java.util.Optional;

public interface PasswordResetCodeRepository {
    PasswordResetCode save(PasswordResetCode passwordResetCode);
    Optional<PasswordResetCode> findByEmailAndCodeHash(String email, String codeHash);
    void deleteByEmail(String email);
}

