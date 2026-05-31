package com.healthcore.clinical.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlanIngredientDraftTest {

    @Test
    void shouldCreatePlanIngredientDraftWhenValuesAreValid() {
        PlanIngredientDraft ingredientDraft = new PlanIngredientDraft(
                "7501234567890",
                PlanIngredientUnit.GRAMS,
                100.0
        );

        assertEquals("7501234567890", ingredientDraft.barcode());
        assertEquals(PlanIngredientUnit.GRAMS, ingredientDraft.unit());
        assertEquals(100.0, ingredientDraft.quantityAmount());
    }

    @Test
    void shouldRejectPlanIngredientDraftWithoutBarcode() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredientDraft(" ", PlanIngredientUnit.GRAMS, 100.0)
        );

        assertEquals("Ingredient barcode is required.", exception.getMessage());
    }

    @Test
    void shouldRejectPlanIngredientDraftWithoutUnit() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredientDraft("7501234567890", null, 100.0)
        );

        assertEquals("Ingredient unit is required.", exception.getMessage());
    }
}
