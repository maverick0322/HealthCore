package com.healthcore.clinical.infrastructure.rest.dto;

public record CatalogFoodResponse(
        String barcode,
        String name,
        String brand,
        String imageUrl,
        double caloriesPer100Units,
        double proteinPer100Units,
        double carbsPer100Units,
        double fatPer100Units
) {}
