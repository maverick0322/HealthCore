package com.healthcore.identity.domain.repository;

import com.healthcore.identity.domain.RefreshTokenOwnership;

import java.util.Optional;

public interface RefreshTokenRepository {
    RefreshTokenOwnership save(RefreshTokenOwnership refreshTokenOwnership);
    Optional<RefreshTokenOwnership> findByTokenHash(String tokenHash);
    void revokeByTokenHash(String tokenHash, String replacedByTokenHash);
    boolean revokeIfActive(String tokenHash, String replacedByTokenHash);
}
