package com.healthcore.clinical.infrastructure.rest.dto;

public record HealthGoalResponse(
    Integer targetCalories,
    Integer targetProtein,
    Integer targetCarbs,
    Integer targetFat
) {}