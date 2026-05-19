package com.healthcore.clinical.domain.model;

import java.util.List;

public record NutritionPlanView(
        String mode,
        AuthorType authorType,
        boolean canEdit,
        DailyGoalsSnapshot dailyGoals,
        List<MealSection> sections,
        NutritionPlan contextSelfManagedPlan
) {}
