package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MealSectionDraftTest {

    @Test
    void shouldDefaultNullDraftOptionsToEmptyList() {
        MealSectionDraft section = new MealSectionDraft(MealSlot.SNACK, null);

        assertEquals(MealSlot.SNACK, section.mealSlot());
        assertEquals(List.of(), section.options());
    }

    @Test
    void shouldCreateMealSectionDraftWithDefensiveOptionsCopy() {
        List<MealOptionDraft> options = new ArrayList<>();
        options.add(createOptionDraft("Avena"));

        MealSectionDraft section = new MealSectionDraft(MealSlot.DINNER, options);
        options.add(createOptionDraft("Yogurt"));

        assertEquals(1, section.options().size());
    }

    @Test
    void shouldRejectMealSectionDraftWithoutMealSlot() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new MealSectionDraft(null, List.of())
        );

        assertEquals("Meal slot is required.", exception.getMessage());
    }

    private MealOptionDraft createOptionDraft(String name) {
        return new MealOptionDraft(
                name,
                "",
                "",
                List.of(new PlanIngredientDraft("7501234567890", PlanIngredientUnit.GRAMS, 100.0))
        );
    }
}
