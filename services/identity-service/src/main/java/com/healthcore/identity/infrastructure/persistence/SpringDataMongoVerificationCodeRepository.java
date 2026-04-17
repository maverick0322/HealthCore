package com.healthcore.identity.infrastructure.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SpringDataMongoVerificationCodeRepository extends MongoRepository<VerificationCodeDocument, String> {
    Optional<VerificationCodeDocument> findByEmailAndCodeHash(String email, String codeHash);
    void deleteByEmail(String email);
}

