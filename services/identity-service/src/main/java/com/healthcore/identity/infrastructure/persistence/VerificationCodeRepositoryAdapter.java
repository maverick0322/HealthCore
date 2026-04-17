package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.VerificationCode;
import com.healthcore.identity.domain.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class VerificationCodeRepositoryAdapter implements VerificationCodeRepository {

    private final SpringDataMongoVerificationCodeRepository mongoRepository;

    @Override
    public VerificationCode save(VerificationCode verificationCode) {
        VerificationCodeDocument savedDocument = mongoRepository.save(toDocument(verificationCode));
        return toDomain(savedDocument);
    }

    @Override
    public Optional<VerificationCode> findByEmailAndCodeHash(String email, String codeHash) {
        return mongoRepository.findByEmailAndCodeHash(email, codeHash)
                .map(this::toDomain);
    }

    @Override
    public void deleteByEmail(String email) {
        mongoRepository.deleteByEmail(email);
    }

    private VerificationCode toDomain(VerificationCodeDocument document) {
        return VerificationCode.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .email(document.getEmail())
                .codeHash(document.getCodeHash())
                .expiresAt(document.getExpiresAt())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private VerificationCodeDocument toDocument(VerificationCode verificationCode) {
        return VerificationCodeDocument.builder()
                .id(verificationCode.getId())
                .userId(verificationCode.getUserId())
                .email(verificationCode.getEmail())
                .codeHash(verificationCode.getCodeHash())
                .expiresAt(verificationCode.getExpiresAt())
                .createdAt(verificationCode.getCreatedAt())
                .build();
    }
}

