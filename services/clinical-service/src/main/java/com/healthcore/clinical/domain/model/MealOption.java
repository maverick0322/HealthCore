package com.healthcore.clinical.domain.model;

import java.util.List;

public record MealOption(
        String id,
        String name,
        String instructions,
        String notes,
        List<PlanIngredient> ingredients,
        int totalCalories,
        int totalProtein,
        int totalCarbs,
        int totalFat
) {
    public MealOption {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Meal option id is required.");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Meal option name is required.");
        }
        if (ingredients == null || ingredients.isEmpty()) {
            throw new IllegalArgumentException("Meal option must contain at least one ingredient.");
        }
        ingredients = List.copyOf(ingredients);
        instructions = instructions == null ? "" : instructions.trim();
        notes = notes == null ? "" : notes.trim();
    }
}
