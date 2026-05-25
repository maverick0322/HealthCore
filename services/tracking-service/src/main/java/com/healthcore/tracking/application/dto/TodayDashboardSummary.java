package com.healthcore.tracking.application.dto;

/**
 * Immutable Data Transfer Object specifically tailored for the Dashboard UI.
 * Aggregates information from different domain boundaries (Meals and Water)
 * to provide a single, cohesive response for the frontend.
 */
public record TodayDashboardSummary(
        double totalCalories,
        double totalProteins,
        double totalCarbs,
        double totalFats,
        int totalWaterMl,
        int currentStreak,
        int bestStreak
) {}