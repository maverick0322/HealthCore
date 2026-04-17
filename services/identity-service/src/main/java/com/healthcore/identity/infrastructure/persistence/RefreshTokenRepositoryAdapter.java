package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.RefreshTokenOwnership;
import com.healthcore.identity.domain.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepository {

    private final SpringDataMongoRefreshTokenRepository mongoRepository;

    @Override
    public RefreshTokenOwnership save(RefreshTokenOwnership refreshTokenOwnership) {
        RefreshTokenDocument savedDocument = mongoRepository.save(toDocument(refreshTokenOwnership));
        return toDomain(savedDocument);
    }

    @Override
    public Optional<RefreshTokenOwnership> findByTokenHash(String tokenHash) {
        return mongoRepository.findByTokenHash(tokenHash)
                .map(this::toDomain);
    }

    @Override
    public void revokeByTokenHash(String tokenHash, String replacedByTokenHash) {
        mongoRepository.findByTokenHash(tokenHash)
                .ifPresent(document -> {
                    document.setRevoked(true);
                    document.setRevokedAt(LocalDateTime.now());
                    document.setReplacedByTokenHash(replacedByTokenHash);
                    mongoRepository.save(document);
                });
    }

    private RefreshTokenOwnership toDomain(RefreshTokenDocument document) {
        return RefreshTokenOwnership.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .email(document.getEmail())
                .tokenHash(document.getTokenHash())
                .expiresAt(document.getExpiresAt())
                .revoked(document.isRevoked())
                .revokedAt(document.getRevokedAt())
                .replacedByTokenHash(document.getReplacedByTokenHash())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private RefreshTokenDocument toDocument(RefreshTokenOwnership refreshTokenOwnership) {
        return RefreshTokenDocument.builder()
                .id(refreshTokenOwnership.getId())
                .userId(refreshTokenOwnership.getUserId())
                .email(refreshTokenOwnership.getEmail())
                .tokenHash(refreshTokenOwnership.getTokenHash())
                .expiresAt(refreshTokenOwnership.getExpiresAt())
                .revoked(refreshTokenOwnership.isRevoked())
                .revokedAt(refreshTokenOwnership.getRevokedAt())
                .replacedByTokenHash(refreshTokenOwnership.getReplacedByTokenHash())
                .createdAt(refreshTokenOwnership.getCreatedAt())
                .build();
    }
}

