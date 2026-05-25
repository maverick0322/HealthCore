package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlanIngredientTest {

    @Test
    void shouldCreatePlanIngredientWhenValuesAreValid() {
        PlanIngredient ingredient = new PlanIngredient(
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
        );

        assertEquals("7501234567890", ingredient.barcode());
        assertEquals(100.0, ingredient.quantityAmount());
    }

    @Test
    void shouldRejectPlanIngredientWithoutRequiredValues() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredient(
                        "",
                        "Avena",
                        null,
                        null,
                        PlanIngredientUnit.GRAMS,
                        100.0,
                        380,
                        12,
                        60,
                        7
                )
        );

        assertEquals("Ingredient barcode is required.", exception.getMessage());
    }

    @Test
    void shouldRejectPlanIngredientDraftWithZeroQuantity() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredientDraft("7501234567890", PlanIngredientUnit.GRAMS, 0)
        );

        assertEquals("Ingredient quantity must be greater than zero.", exception.getMessage());
    }
}
