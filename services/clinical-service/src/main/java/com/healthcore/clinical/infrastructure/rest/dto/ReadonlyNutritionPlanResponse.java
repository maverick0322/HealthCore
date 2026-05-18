package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ReadonlyNutritionPlanResponse(
        String authorType,
        HealthGoalResponse dailyGoals,
        List<NutritionPlanSectionResponse> sections,
        LocalDateTime updatedAt
) {}
