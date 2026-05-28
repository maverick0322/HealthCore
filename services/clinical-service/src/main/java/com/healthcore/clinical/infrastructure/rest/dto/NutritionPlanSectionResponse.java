package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionPlanSectionResponse", description = "Meal section returned inside a nutrition plan.")
public record NutritionPlanSectionResponse(
        @Schema(description = "Meal slot enum value", example = "BREAKFAST")
        String mealSlot,
        @Schema(description = "Meal options available in the section")
        List<NutritionPlanMealOptionResponse> options
) {}
