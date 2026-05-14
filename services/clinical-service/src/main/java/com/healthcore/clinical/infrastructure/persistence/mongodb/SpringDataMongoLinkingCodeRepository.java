package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SpringDataMongoLinkingCodeRepository extends MongoRepository<LinkingCodeDocument, String> {
    List<LinkingCodeDocument> findByNutritionistId(String nutritionistId);
    void deleteByNutritionistId(String nutritionistId);
}