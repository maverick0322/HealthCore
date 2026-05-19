package com.healthcore.clinical.domain.model;

import java.util.List;

public record MealSection(
        MealSlot mealSlot,
        List<MealOption> options
) {
    public MealSection {
        if (mealSlot == null) {
            throw new IllegalArgumentException("Meal slot is required.");
        }
        options = options == null ? List.of() : List.copyOf(options);
    }
}
