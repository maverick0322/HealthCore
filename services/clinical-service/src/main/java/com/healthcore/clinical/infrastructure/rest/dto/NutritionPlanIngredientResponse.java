package com.healthcore.clinical.infrastructure.rest.dto;

public record NutritionPlanIngredientResponse(
        String barcode,
        String name,
        String brand,
        String imageUrl,
        String unit,
        double quantityAmount,
        int calories,
        int proteinGrams,
        int carbsGrams,
        int fatGrams
) {}
