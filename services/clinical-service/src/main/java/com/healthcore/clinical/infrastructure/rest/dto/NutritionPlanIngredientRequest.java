package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Schema(name = "NutritionPlanIngredientRequest", description = "Ingredient reference used in a nutrition plan meal option.")
public record NutritionPlanIngredientRequest(
        @Schema(description = "Catalog barcode or identifier", example = "food-1")
        @NotBlank String barcode,
        @Schema(description = "Unit enum value", example = "GRAMS")
        @NotBlank String unit,
        @Schema(description = "Amount of the ingredient in the given unit", example = "100.0")
        @NotNull @Positive Double quantityAmount
) {}
