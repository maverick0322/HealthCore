package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MealSectionTest {

    @Test
    void shouldDefaultNullOptionsToEmptyList() {
        MealSection section = new MealSection(MealSlot.BREAKFAST, null);

        assertEquals(MealSlot.BREAKFAST, section.mealSlot());
        assertEquals(List.of(), section.options());
    }

    @Test
    void shouldCreateMealSectionWithDefensiveOptionsCopy() {
        List<MealOption> options = new ArrayList<>();
        options.add(createOption("option-1"));

        MealSection section = new MealSection(MealSlot.LUNCH, options);
        options.add(createOption("option-2"));

        assertEquals(1, section.options().size());
    }

    @Test
    void shouldRejectMealSectionWithoutMealSlot() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new MealSection(null, List.of())
        );

        assertEquals("Meal slot is required.", exception.getMessage());
    }

    private MealOption createOption(String id) {
        return new MealOption(
                id,
                "Comida ejemplo",
                "",
                "",
                List.of(new PlanIngredient(
                        "7501234567890",
                        "Avena",
                        "Marca",
                        null,
                        PlanIngredientUnit.GRAMS,
                        100.0,
                        380,
                        12,
                        60,
                        7
                )),
                380,
                18,
                52,
                9
        );
    }
}
