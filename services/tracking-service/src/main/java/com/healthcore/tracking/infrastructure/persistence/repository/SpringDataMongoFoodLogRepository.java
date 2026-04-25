package com.healthcore.tracking.infrastructure.persistence.repository;

import com.healthcore.tracking.infrastructure.persistence.entity.FoodLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SpringDataMongoFoodLogRepository extends MongoRepository<FoodLogDocument, String> {
    List<FoodLogDocument> findByUserIdAndConsumedAtBetween(String userId, LocalDateTime start, LocalDateTime end);
}