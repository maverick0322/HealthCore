package com.healthcore.clinical.domain.model;

public record CatalogFoodItem(
        String barcode,
        String name,
        String brand,
        String imageUrl,
        double caloriesPer100Units,
        double proteinPer100Units,
        double carbsPer100Units,
        double fatPer100Units
) {}
