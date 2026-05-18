package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

public record NutritionPlanViewResponse(
        String mode,
        String authorType,
        boolean canEdit,
        HealthGoalResponse dailyGoals,
        List<NutritionPlanSectionResponse> sections,
        ReadonlyNutritionPlanResponse contextSelfManagedPlan
) {}
