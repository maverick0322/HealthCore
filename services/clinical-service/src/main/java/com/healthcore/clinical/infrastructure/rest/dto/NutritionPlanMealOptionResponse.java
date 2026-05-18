package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

public record NutritionPlanMealOptionResponse(
        String id,
        String name,
        String instructions,
        String notes,
        List<NutritionPlanIngredientResponse> ingredients,
        int totalCalories,
        int totalProtein,
        int totalCarbs,
        int totalFat
) {}
