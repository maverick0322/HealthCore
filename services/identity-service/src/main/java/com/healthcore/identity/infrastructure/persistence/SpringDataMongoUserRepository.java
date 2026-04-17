package com.healthcore.identity.infrastructure.persistence;

import com.healthcore.identity.domain.AuthProvider;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface SpringDataMongoUserRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByEmail(String email);
    Optional<UserDocument> findByEmailAndProvider(String email, AuthProvider provider);
}