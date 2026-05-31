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
        assertEquals("Avena", ingredient.name());
        assertEquals(100.0, ingredient.quantityAmount());
    }

    @Test
    void shouldRejectPlanIngredientWithoutBarcode() {
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
    void shouldRejectPlanIngredientWithoutName() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredient(
                        "7501234567890",
                        " ",
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

        assertEquals("Ingredient name is required.", exception.getMessage());
    }

    @Test
    void shouldRejectPlanIngredientWithoutUnit() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredient(
                        "7501234567890",
                        "Avena",
                        null,
                        null,
                        null,
                        100.0,
                        380,
                        12,
                        60,
                        7
                )
        );

        assertEquals("Ingredient unit is required.", exception.getMessage());
    }

    @Test
    void shouldRejectPlanIngredientWithZeroQuantity() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredient(
                        "7501234567890",
                        "Avena",
                        null,
                        null,
                        PlanIngredientUnit.GRAMS,
                        0,
                        380,
                        12,
                        60,
                        7
                )
        );

        assertEquals("Ingredient quantity must be greater than zero.", exception.getMessage());
    }

    @Test
    void shouldRejectPlanIngredientWithNegativeQuantity() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new PlanIngredient(
                        "7501234567890",
                        "Avena",
                        null,
                        null,
                        PlanIngredientUnit.GRAMS,
                        -5.0,
                        380,
                        12,
                        60,
                        7
                )
        );

        assertEquals("Ingredient quantity must be greater than zero.", exception.getMessage());
    }
}
