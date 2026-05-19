package com.healthcore.clinical.domain.model;

public record PlanIngredientDraft(
        String barcode,
        PlanIngredientUnit unit,
        double quantityAmount
) {
    public PlanIngredientDraft {
        if (barcode == null || barcode.isBlank()) {
            throw new IllegalArgumentException("Ingredient barcode is required.");
        }
        if (unit == null) {
            throw new IllegalArgumentException("Ingredient unit is required.");
        }
        if (quantityAmount <= 0) {
            throw new IllegalArgumentException("Ingredient quantity must be greater than zero.");
        }
    }
}
