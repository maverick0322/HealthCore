package com.healthcore.tracking.infrastructure.persistence.repository;

import com.healthcore.tracking.infrastructure.persistence.entity.WaterLogDocument;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SpringDataMongoWaterLogRepository extends MongoRepository<WaterLogDocument, String> {

    @Aggregation(pipeline = {
            "{ $match: { userId: ?0, consumedAt: { $gte: ?1, $lte: ?2 } } }",
            "{ $group: { '_id': null, 'totalMl': { $sum: '$amountMl' } } }"
    })
    Integer sumWaterAmountByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end);

    Optional<WaterLogDocument> findFirstByUserIdAndConsumedAtBetweenOrderByConsumedAtDesc(String userId, LocalDateTime start, LocalDateTime end);
}