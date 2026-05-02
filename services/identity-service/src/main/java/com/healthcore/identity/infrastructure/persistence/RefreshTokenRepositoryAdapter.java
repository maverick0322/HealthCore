package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.RefreshTokenOwnership;
import com.healthcore.identity.domain.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepository {

    private final SpringDataMongoRefreshTokenRepository mongoRepository;
    private final MongoTemplate mongoTemplate;

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
                    document.setRevokedAt(Instant.now());
                    document.setReplacedByTokenHash(replacedByTokenHash);
                    mongoRepository.save(document);
                });
    }

    @Override
    public boolean revokeIfActive(String tokenHash, String replacedByTokenHash) {
        Query query = new Query(Criteria.where("token_hash").is(tokenHash).and("revoked").is(false));
        Update update = new Update()
                .set("revoked", true)
                .set("revoked_at", Instant.now())
                .set("replaced_by_token_hash", replacedByTokenHash);
        return mongoTemplate.updateFirst(query, update, RefreshTokenDocument.class)
                .getModifiedCount() > 0;
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
