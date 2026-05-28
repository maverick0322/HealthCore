package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionPlanIngredientResponse", description = "Resolved ingredient information inside a nutrition plan.")
public record NutritionPlanIngredientResponse(
        @Schema(description = "Catalog barcode or identifier", example = "food-1")
        String barcode,
        @Schema(description = "Ingredient display name", example = "Oats")
        String name,
        @Schema(description = "Brand name", example = "HealthCore Foods")
        String brand,
        @Schema(description = "Resolved image URL", example = "https://cdn.example.com/catalog/oats.png")
        String imageUrl,
        @Schema(description = "Unit enum value", example = "GRAMS")
        String unit,
        @Schema(description = "Quantity amount in the given unit", example = "100.0")
        double quantityAmount,
        @Schema(description = "Calories contributed by the ingredient", example = "300")
        int calories,
        @Schema(description = "Protein grams contributed by the ingredient", example = "15")
        int proteinGrams,
        @Schema(description = "Carbohydrate grams contributed by the ingredient", example = "40")
        int carbsGrams,
        @Schema(description = "Fat grams contributed by the ingredient", example = "10")
        int fatGrams
) {}
