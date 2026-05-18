package com.healthcore.clinical.domain.model;

public record HealthGoal(
    Integer targetCalories,
    Integer targetProtein,
    Integer targetCarbs,
    Integer targetFat,
    Integer targetWaterGlasses
) {}
