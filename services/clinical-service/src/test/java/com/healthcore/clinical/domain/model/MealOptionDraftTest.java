package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MealOptionDraftTest {

    @Test
    void shouldCreateMealOptionDraftWithDefensiveIngredientCopy() {
        List<PlanIngredientDraft> ingredients = new ArrayList<>();
        ingredients.add(new PlanIngredientDraft("7501234567890", PlanIngredientUnit.GRAMS, 100.0));

        MealOptionDraft optionDraft = new MealOptionDraft(
                "Avena con fruta",
                "Mezclar",
                "Sin azucar",
                ingredients
        );
        ingredients.add(new PlanIngredientDraft("7501234567891", PlanIngredientUnit.GRAMS, 50.0));

        assertEquals("Avena con fruta", optionDraft.name());
        assertEquals(1, optionDraft.ingredients().size());
    }

    @Test
    void shouldRejectMealOptionDraftWithoutName() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new MealOptionDraft(" ", "Mezclar", "Sin azucar", List.of(
                        new PlanIngredientDraft("7501234567890", PlanIngredientUnit.GRAMS, 100.0)
                ))
        );

        assertEquals("Meal option name is required.", exception.getMessage());
    }

    @Test
    void shouldRejectMealOptionDraftWithoutIngredients() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new MealOptionDraft("Avena con fruta", "Mezclar", "Sin azucar", List.of())
        );

        assertEquals("Meal option must contain at least one ingredient.", exception.getMessage());
    }
}
