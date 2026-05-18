package com.healthcore.tracking.domain.model;

/**
 * Immutable Read Model (Projection) for the Dashboard's historical charts.
 * Mapped directly from database aggregations to avoid processing in memory.
 */
public record DailyMacroSummary(
        String date, // ISO-8601 Date (YYYY-MM-DD)
        double totalCalories,
        double totalProteins,
        double totalCarbs,
        double totalFats
) {}