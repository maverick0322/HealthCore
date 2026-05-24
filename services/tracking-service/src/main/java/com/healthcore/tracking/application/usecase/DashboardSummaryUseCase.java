package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.port.MealLogPort;
import com.healthcore.tracking.domain.port.WaterLogPort;
import com.healthcore.tracking.infrastructure.grpc.client.MediaGrpcClientAdapter;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Application Service dedicated to reading and aggregating data for UI Dashboards.
 * Implements a lightweight CQRS (Command Query Responsibility Segregation) pattern
 * by strictly handling read operations and projections.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardSummaryUseCase {

    private final MealLogPort mealLogPort;
    private final WaterLogPort waterLogPort;
    private final MediaGrpcClientAdapter mediaGrpcClient;

    public TodayDashboardSummary getTodaySummary(String userId, LocalDate date) {
        validateUserId(userId);

        log.info("Fetching today's dashboard summary. userHash={}", logHash(userId));

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // 1. Fetch raw data from persistence
        List<MealLog> rawMeals = mealLogPort.findByUserIdAndDateRange(userId, startOfDay, endOfDay);

        // 2. Map and enrich the data with secure pre-signed URLs via gRPC
        List<MealLog> enrichedMeals = rawMeals.stream().map(meal -> {
            if (meal.getPhotoKey() != null && !meal.getPhotoKey().isBlank()) {
                try {
                    String presignedReadUrl = mediaGrpcClient.getPresignedReadUrl(meal.getPhotoKey());

                    // Leveraging Lombok's toBuilder to enforce immutability while updating the URL
                    return meal.toBuilder()
                            .photoKey(presignedReadUrl)
                            .build();

                } catch (StatusRuntimeException grpcEx) {
                    // Specific network or server-side gRPC errors (e.g., UNAVAILABLE, DEADLINE_EXCEEDED)
                    log.error("gRPC failure while generating secure read URL for photoKey: {}. Status: {}",
                            meal.getPhotoKey(), grpcEx.getStatus().getCode());
                } catch (IllegalArgumentException iae) {
                    // Validation errors inside the grpc client
                    log.warn("Invalid photo key format provided to media service: {}", meal.getPhotoKey());
                } catch (Exception e) {
                    // Unforeseen runtime crashes
                    log.error("Unexpected error generating URL for photoKey: {}. Error: {}",
                            meal.getPhotoKey(), e.getMessage());
                }
            }
            // Fallback: If no photo exists, or if any error occurred, return the unmodified immutable object
            return meal;
        }).collect(Collectors.toList());

        // 3. Calculate aggregates based on the enriched list
        double totalCalories = enrichedMeals.stream().mapToDouble(MealLog::getTotalCalories).sum();
        double totalProteins = enrichedMeals.stream().mapToDouble(MealLog::getTotalProteins).sum();
        double totalCarbs = enrichedMeals.stream().mapToDouble(MealLog::getTotalCarbs).sum();
        double totalFats = enrichedMeals.stream().mapToDouble(MealLog::getTotalFats).sum();

        int totalWater = waterLogPort.getConsumedWaterBetween(userId, startOfDay, endOfDay);

        return new TodayDashboardSummary(totalCalories, totalProteins, totalCarbs, totalFats, totalWater);
    }

    public List<DailyMacroSummary> getHistoricalMacros(String userId, LocalDate startDate, LocalDate endDate) {
        validateUserId(userId);

        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            log.warn("Invalid date range requested for historical macros. Start: {}, End: {}", startDate, endDate);
            throw new InvalidDomainDataException("Start date must be provided and cannot be after end date.");
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        log.info("Fetching historical macros. userHash={} start={} end={}", logHash(userId), start, end);

        return mealLogPort.aggregateHistoricalMacros(userId, start, end);
    }

    private void validateUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            log.warn("Dashboard data requested with null or empty userId.");
            throw new InvalidDomainDataException("User identification is required to retrieve dashboard data.");
        }
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}