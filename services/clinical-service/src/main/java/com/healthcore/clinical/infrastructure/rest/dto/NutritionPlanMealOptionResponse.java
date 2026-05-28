package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionPlanMealOptionResponse", description = "Meal option returned inside a nutrition plan section.")
public record NutritionPlanMealOptionResponse(
        @Schema(description = "Meal option identifier", example = "meal-1")
        String id,
        @Schema(description = "Meal option name", example = "Oatmeal with berries")
        String name,
        @Schema(description = "Preparation instructions", example = "Cook oats with water and top with berries.")
        String instructions,
        @Schema(description = "Additional serving or substitution notes", example = "Swap berries for apple if unavailable.")
        String notes,
        @Schema(description = "Resolved ingredients")
        List<NutritionPlanIngredientResponse> ingredients,
        @Schema(description = "Total calories for the meal option", example = "300")
        int totalCalories,
        @Schema(description = "Total protein grams for the meal option", example = "15")
        int totalProtein,
        @Schema(description = "Total carbohydrate grams for the meal option", example = "40")
        int totalCarbs,
        @Schema(description = "Total fat grams for the meal option", example = "10")
        int totalFat
) {}
