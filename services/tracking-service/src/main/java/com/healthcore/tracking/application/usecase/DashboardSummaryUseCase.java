package com.healthcore.tracking.application.usecase;

import com.healthcore.tracking.application.dto.TodayDashboardSummary;
import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.port.MealLogPort;
import com.healthcore.tracking.domain.port.WaterLogPort;
import com.healthcore.tracking.infrastructure.grpc.client.MediaGrpcClientAdapter;
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

        List<MealLog> todayMeals = mealLogPort.findByUserIdAndDateRange(userId, startOfDay, endOfDay);

        todayMeals.forEach(meal -> {
            if (meal.getPhotoKey() != null && !meal.getPhotoKey().isBlank()) {
                try {
                    String presignedReadUrl = mediaGrpcClient.getPresignedReadUrl(meal.getPhotoKey());
                    meal.setPhotoKey(presignedReadUrl);
                } catch (Exception e) {
                    log.error("Failed to generate secure read URL for photoKey: {}. Falling back to null.", meal.getPhotoKey());
                    meal.setPhotoKey(null);
                }
            }
        });

        double totalCalories = todayMeals.stream().mapToDouble(MealLog::getTotalCalories).sum();
        double totalProteins = todayMeals.stream().mapToDouble(MealLog::getTotalProteins).sum();
        double totalCarbs = todayMeals.stream().mapToDouble(MealLog::getTotalCarbs).sum();
        double totalFats = todayMeals.stream().mapToDouble(MealLog::getTotalFats).sum();

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
