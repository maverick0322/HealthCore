package com.healthcore.identity.infrastructure.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SpringDataMongoPasswordResetCodeRepository extends MongoRepository<PasswordResetCodeDocument, String> {
    Optional<PasswordResetCodeDocument> findByEmailAndCodeHash(String email, String codeHash);
    void deleteByEmail(String email);
}

