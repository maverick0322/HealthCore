package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CatalogFoodResponse", description = "Food item returned by the catalog search endpoint.")
public record CatalogFoodResponse(
        @Schema(description = "Catalog barcode or identifier", example = "food-1")
        String barcode,
        @Schema(description = "Food display name", example = "Oats")
        String name,
        @Schema(description = "Brand name", example = "HealthCore Foods")
        String brand,
        @Schema(description = "Image URL", example = "https://cdn.example.com/catalog/oats.png")
        String imageUrl,
        @Schema(description = "Calories per 100 units", example = "100.0")
        double caloriesPer100Units,
        @Schema(description = "Protein grams per 100 units", example = "10.0")
        double proteinPer100Units,
        @Schema(description = "Carbohydrate grams per 100 units", example = "20.0")
        double carbsPer100Units,
        @Schema(description = "Fat grams per 100 units", example = "5.0")
        double fatPer100Units
) {}
