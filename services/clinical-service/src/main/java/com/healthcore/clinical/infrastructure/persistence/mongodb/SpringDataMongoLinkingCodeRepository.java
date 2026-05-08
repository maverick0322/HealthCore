package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface SpringDataMongoLinkingCodeRepository extends MongoRepository<LinkingCodeDocument, String> {
    Optional<LinkingCodeDocument> findByNutritionistId(String nutritionistId);
}