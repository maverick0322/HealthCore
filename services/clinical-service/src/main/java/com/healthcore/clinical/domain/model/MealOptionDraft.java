package com.healthcore.clinical.domain.model;

import java.util.List;

public record MealOptionDraft(
        String name,
        String instructions,
        String notes,
        List<PlanIngredientDraft> ingredients
) {
    public MealOptionDraft {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Meal option name is required.");
        }
        if (ingredients == null || ingredients.isEmpty()) {
            throw new IllegalArgumentException("Meal option must contain at least one ingredient.");
        }
        ingredients = List.copyOf(ingredients);
    }
}
