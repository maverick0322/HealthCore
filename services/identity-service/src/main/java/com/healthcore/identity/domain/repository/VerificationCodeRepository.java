package com.healthcore.identity.domain.repository;

import com.healthcore.identity.domain.VerificationCode;

import java.util.Optional;

public interface VerificationCodeRepository {
    VerificationCode save(VerificationCode verificationCode);
    Optional<VerificationCode> findByEmailAndCodeHash(String email, String codeHash);
    void deleteByEmail(String email);
}

