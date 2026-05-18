package com.healthcore.clinical.domain.model;

import java.util.List;

public record NutritionPlanDraft(List<MealSectionDraft> sections) {
    public NutritionPlanDraft {
        if (sections == null || sections.size() != MealSlot.values().length) {
            throw new IllegalArgumentException("Nutrition plan draft must contain exactly four sections.");
        }
        sections = List.copyOf(sections);
    }
}
