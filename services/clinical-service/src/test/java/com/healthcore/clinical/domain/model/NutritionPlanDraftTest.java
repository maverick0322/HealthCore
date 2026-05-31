package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NutritionPlanDraftTest {

    @Test
    void shouldCreateNutritionPlanDraftWithDefensiveSectionCopy() {
        List<MealSectionDraft> sections = new ArrayList<>(createDraftSections());

        NutritionPlanDraft draft = new NutritionPlanDraft(sections);
        sections.add(createDraftSection(MealSlot.BREAKFAST, "Extra"));

        assertEquals(4, draft.sections().size());
    }

    @Test
    void shouldRejectNutritionPlanDraftWithoutExactSectionCount() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new NutritionPlanDraft(List.of(
                        createDraftSection(MealSlot.BREAKFAST, "Desayuno"),
                        createDraftSection(MealSlot.LUNCH, "Comida"),
                        createDraftSection(MealSlot.DINNER, "Cena")
                ))
        );

        assertEquals("Nutrition plan draft must contain exactly four sections.", exception.getMessage());
    }

    private List<MealSectionDraft> createDraftSections() {
        return List.of(
                createDraftSection(MealSlot.BREAKFAST, "Desayuno"),
                createDraftSection(MealSlot.LUNCH, "Comida"),
                createDraftSection(MealSlot.DINNER, "Cena"),
                createDraftSection(MealSlot.SNACK, "Colacion")
        );
    }

    private MealSectionDraft createDraftSection(MealSlot mealSlot, String mealName) {
        return new MealSectionDraft(
                mealSlot,
                List.of(new MealOptionDraft(
                        mealName,
                        "",
                        "",
                        List.of(new PlanIngredientDraft("7501234567890", PlanIngredientUnit.GRAMS, 100.0))
                ))
        );
    }
}
