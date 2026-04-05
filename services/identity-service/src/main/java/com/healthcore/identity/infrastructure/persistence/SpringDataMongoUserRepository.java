package com.healthcore.identity.infrastructure.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface SpringDataMongoUserRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByEmail(String email);
}