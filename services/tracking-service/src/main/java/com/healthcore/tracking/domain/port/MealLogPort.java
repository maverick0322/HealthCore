package com.healthcore.tracking.domain.port;

import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealLog;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Outbound Port (Driven Adapter interface) to handle persistence of Meal Logs.
 * Follows Dependency Inversion Principle (DIP).
 */
public interface MealLogPort {

    /**
     * Persists a newly created or modified MealLog.
     * @param mealLog The aggregate root to save.
     * @return The persisted MealLog.
     */
    MealLog save(MealLog mealLog);

    /**
     * Retrieves all meal logs for a given user within a specific date range.
     * @param userId The unique identifier of the user.
     * @param start The start of the time window.
     * @param end The end of the time window.
     * @return List of matched MealLogs.
     */
    List<MealLog> findByUserIdAndDateRange(String userId, LocalDateTime start, LocalDateTime end);

    /**
     * Executes a native aggregation to calculate historical macros grouped by day.
     * @param userId The unique identifier of the user.
     * @param start The start date.
     * @param end The end date.
     * @return A list of daily summaries.
     */
    List<DailyMacroSummary> aggregateHistoricalMacros(String userId, LocalDateTime start, LocalDateTime end);

    /**
     * Retrieves a unique set of dates where the user has logged at least one meal.
     * Used for calculating streaks and adherence metrics efficiently without loading full documents.
     * * @param userId The unique identifier of the user.
     * @return A set of LocalDates representing days with activity.
     */
    Set<LocalDate> findDistinctLoggedDatesByUserId(String userId);
}