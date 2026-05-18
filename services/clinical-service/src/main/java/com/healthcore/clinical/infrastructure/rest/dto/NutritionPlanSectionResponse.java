package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

public record NutritionPlanSectionResponse(
        String mealSlot,
        List<NutritionPlanMealOptionResponse> options
) {}
