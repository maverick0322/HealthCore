package com.healthcore.tracking.domain.port;

import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Outbound Port for MealLog persistence.
 * Strictly defines the contract the infrastructure layer must fulfill,
 * decoupling the Domain from Spring Data MongoDB or any specific database.
 */
public interface MealLogPort {
    MealLog save(MealLog mealLog);
    List<MealLog> findByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end);
    List<DailyMacroSummary> aggregateHistoricalMacros(String userId, LocalDateTime start, LocalDateTime end);
}