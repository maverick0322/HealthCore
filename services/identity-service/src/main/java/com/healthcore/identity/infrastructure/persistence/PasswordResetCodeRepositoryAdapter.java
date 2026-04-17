    package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.PasswordResetCode;
import com.healthcore.identity.domain.repository.PasswordResetCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PasswordResetCodeRepositoryAdapter implements PasswordResetCodeRepository {

    private final SpringDataMongoPasswordResetCodeRepository mongoRepository;

    @Override
    public PasswordResetCode save(PasswordResetCode passwordResetCode) {
        PasswordResetCodeDocument savedDocument = mongoRepository.save(toDocument(passwordResetCode));
        return toDomain(savedDocument);
    }

    @Override
    public Optional<PasswordResetCode> findByEmailAndCodeHash(String email, String codeHash) {
        return mongoRepository.findByEmailAndCodeHash(email, codeHash)
                .map(this::toDomain);
    }

    @Override
    public void deleteByEmail(String email) {
        mongoRepository.deleteByEmail(email);
    }

    private PasswordResetCode toDomain(PasswordResetCodeDocument document) {
        return PasswordResetCode.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .email(document.getEmail())
                .codeHash(document.getCodeHash())
                .expiresAt(document.getExpiresAt())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private PasswordResetCodeDocument toDocument(PasswordResetCode passwordResetCode) {
        return PasswordResetCodeDocument.builder()
                .id(passwordResetCode.getId())
                .userId(passwordResetCode.getUserId())
                .email(passwordResetCode.getEmail())
                .codeHash(passwordResetCode.getCodeHash())
                .expiresAt(passwordResetCode.getExpiresAt())
                .createdAt(passwordResetCode.getCreatedAt())
                .build();
    }
}

