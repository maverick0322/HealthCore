package com.healthcore.clinical.domain.model;

public record PlanIngredient(
        String barcode,
        String name,
        String brand,
        String imageUrl,
        PlanIngredientUnit unit,
        double quantityAmount,
        int calories,
        int proteinGrams,
        int carbsGrams,
        int fatGrams
) {
    public PlanIngredient {
        if (barcode == null || barcode.isBlank()) {
            throw new IllegalArgumentException("Ingredient barcode is required.");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Ingredient name is required.");
        }
        if (unit == null) {
            throw new IllegalArgumentException("Ingredient unit is required.");
        }
        if (quantityAmount <= 0) {
            throw new IllegalArgumentException("Ingredient quantity must be greater than zero.");
        }
    }
}
