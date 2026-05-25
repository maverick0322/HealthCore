package com.healthcore.clinical.infrastructure.persistence.mongodb;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SpringDataMongoLinkingCodeRepository extends MongoRepository<LinkingCodeDocument, String> {
    List<LinkingCodeDocument> findByNutritionistId(String nutritionistId);
    void deleteByNutritionistId(String nutritionistId);
}