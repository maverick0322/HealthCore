package com.healthcore.tracking.infrastructure.persistence.repository;

import com.healthcore.tracking.infrastructure.persistence.entity.MealLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SpringDataMongoMealLogRepository extends MongoRepository<MealLogDocument, String> {
    List<MealLogDocument> findByUserIdAndConsumedAtBetween(String userId, LocalDateTime start, LocalDateTime end);
}