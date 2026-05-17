package com.healthcore.tracking.infrastructure.persistence.repository;

import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.infrastructure.persistence.entity.MealLogDocument;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SpringDataMongoMealLogRepository extends MongoRepository<MealLogDocument, String> {
    List<MealLogDocument> findByUserIdAndConsumedAtBetween(String userId, LocalDateTime start, LocalDateTime end);

    /**
     * Executes a native MongoDB Aggregation pipeline.
     * 1. Filters by user and date range.
     * 2. Groups by the day of the year.
     * 3. Sums the pre-calculated macros from the document.
     * 4. Projects them into the DailyMacroSummary structure.
     * 5. Sorts chronologically.
     */
    @Aggregation(pipeline = {
            "{ $match: { userId: ?0, consumedAt: { $gte: ?1, $lte: ?2 } } }",
            "{ $group: { " +
                    "'_id': { $dateToString: { format: '%Y-%m-%d', date: '$consumedAt' } }, " +
                    "'totalCalories': { $sum: '$totalCalories' }, " +
                    "'totalProteins': { $sum: '$totalProteins' }, " +
                    "'totalCarbs': { $sum: '$totalCarbs' }, " +
                    "'totalFats': { $sum: '$totalFats' } " +
                    "} }",
            "{ $project: { 'date': '$_id', 'totalCalories': 1, 'totalProteins': 1, 'totalCarbs': 1, 'totalFats': 1, '_id': 0 } }",
            "{ $sort: { 'date': 1 } }"
    })
    List<DailyMacroSummary> aggregateHistoricalMacros(String userId, LocalDateTime startDate, LocalDateTime endDate);
}