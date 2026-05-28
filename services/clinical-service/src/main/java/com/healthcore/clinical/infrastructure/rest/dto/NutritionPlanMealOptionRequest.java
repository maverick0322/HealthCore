package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Schema(name = "NutritionPlanMealOptionRequest", description = "A concrete meal option within a nutrition plan section.")
public record NutritionPlanMealOptionRequest(
        @Schema(description = "Meal option name", example = "Oatmeal with berries")
        @NotBlank String name,
        @Schema(description = "Preparation instructions", example = "Cook oats with water and top with berries.")
        String instructions,
        @Schema(description = "Additional notes for substitutions or serving", example = "Swap berries for apple if unavailable.")
        String notes,
        @Schema(description = "Ingredients required for the meal option")
        @Valid @NotEmpty List<NutritionPlanIngredientRequest> ingredients
) {}
