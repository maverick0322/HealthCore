package com.healthcore.clinical.domain.model;

import java.util.List;

public record MealSectionDraft(
        MealSlot mealSlot,
        List<MealOptionDraft> options
) {
    public MealSectionDraft {
        if (mealSlot == null) {
            throw new IllegalArgumentException("Meal slot is required.");
        }
        options = options == null ? List.of() : List.copyOf(options);
    }
}
