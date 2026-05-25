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
import java.util.Set;
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

        List<MealLog> rawMeals = mealLogPort.findByUserIdAndDateRange(userId, startOfDay, endOfDay);

        List<MealLog> enrichedMeals = rawMeals.stream().map(meal -> {
            if (meal.getPhotoKey() != null && !meal.getPhotoKey().isBlank()) {
                try {
                    String presignedReadUrl = mediaGrpcClient.getPresignedReadUrl(meal.getPhotoKey());

                    return meal.toBuilder()
                            .photoKey(presignedReadUrl)
                            .build();

                } catch (StatusRuntimeException grpcEx) {
                    log.error("gRPC failure while generating secure read URL for photoKey: {}. Status: {}",
                            meal.getPhotoKey(), grpcEx.getStatus().getCode());
                } catch (IllegalArgumentException iae) {
                    log.warn("Invalid photo key format provided to media service: {}", meal.getPhotoKey());
                } catch (Exception e) {
                    log.error("Unexpected error generating URL for photoKey: {}. Error: {}",
                            meal.getPhotoKey(), e.getMessage());
                }
            }
            return meal;
        }).collect(Collectors.toList());

        double totalCalories = enrichedMeals.stream().mapToDouble(MealLog::getTotalCalories).sum();
        double totalProteins = enrichedMeals.stream().mapToDouble(MealLog::getTotalProteins).sum();
        double totalCarbs = enrichedMeals.stream().mapToDouble(MealLog::getTotalCarbs).sum();
        double totalFats = enrichedMeals.stream().mapToDouble(MealLog::getTotalFats).sum();

        int totalWater = waterLogPort.getConsumedWaterBetween(userId, startOfDay, endOfDay);

        int currentStreak = calculateCurrentStreak(userId);
        int bestStreak = currentStreak;

        return new TodayDashboardSummary(
                totalCalories,
                totalProteins,
                totalCarbs,
                totalFats,
                totalWater,
                currentStreak,
                bestStreak
        );
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

    /**
     * Calculates the consecutive days a user has logged at least one meal.
     */
    private int calculateCurrentStreak(String userId) {
        Set<LocalDate> loggedDates = mealLogPort.findDistinctLoggedDatesByUserId(userId);
        if (loggedDates.isEmpty()) return 0;

        int streak = 0;
        LocalDate today = LocalDate.now();
        LocalDate checkDate = today;

        if (!loggedDates.contains(today) && loggedDates.contains(today.minusDays(1))) {
            checkDate = today.minusDays(1);
        } else if (!loggedDates.contains(today) && !loggedDates.contains(today.minusDays(1))) {
            return 0;
        }

        while (loggedDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return streak;
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