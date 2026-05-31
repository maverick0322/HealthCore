package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MealOptionTest {

    @Test
    void shouldCreateMealOptionWithTrimmedTextAndDefensiveIngredientCopy() {
        List<PlanIngredient> ingredients = new ArrayList<>();
        ingredients.add(createIngredient("7501234567890"));

        MealOption option = new MealOption(
                "option-1",
                "Avena con fruta",
                "  Mezclar y servir  ",
                "  Sin azucar  ",
                ingredients,
                380,
                18,
                52,
                9
        );
        ingredients.add(createIngredient("7501234567891"));

        assertEquals("Mezclar y servir", option.instructions());
        assertEquals("Sin azucar", option.notes());
        assertEquals(1, option.ingredients().size());
    }

    @Test
    void shouldDefaultOptionalTextToEmptyStrings() {
        MealOption option = new MealOption(
                "option-1",
                "Avena con fruta",
                null,
                null,
                List.of(createIngredient("7501234567890")),
                380,
                18,
                52,
                9
        );

        assertEquals("", option.instructions());
        assertEquals("", option.notes());
    }

    @Test
    void shouldRejectMealOptionWithoutIngredients() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new MealOption("option-1", "Avena con fruta", "", "", List.of(), 380, 18, 52, 9)
        );

        assertEquals("Meal option must contain at least one ingredient.", exception.getMessage());
    }

    private PlanIngredient createIngredient(String barcode) {
        return new PlanIngredient(
                barcode,
                "Avena",
                "Marca",
                null,
                PlanIngredientUnit.GRAMS,
                100.0,
                380,
                12,
                60,
                7
        );
    }
}
