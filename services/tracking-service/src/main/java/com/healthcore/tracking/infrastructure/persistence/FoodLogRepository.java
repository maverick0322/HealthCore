package com.healthcore.tracking.infrastructure.persistence;

import com.healthcore.tracking.domain.model.FoodLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FoodLogRepository extends MongoRepository<FoodLog, String> {
    List<FoodLog> findByUserIdAndConsumedAtBetween(String userId, LocalDateTime start, LocalDateTime end);
}