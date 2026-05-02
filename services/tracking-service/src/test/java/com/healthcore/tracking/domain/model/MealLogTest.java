package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MealLogTest {

    private FoodNutrients createDummyNutrients(double calories, double proteins, double carbs, double fats, double sodiumMg) {
        return new FoodNutrients(
                "12345", "Test Food", "Test Brand", null,
                calories, proteins, carbs, fats,
                5.0, sodiumMg, 10.0, 200.0
        );
    }

    @Test
    @DisplayName("MealItem should correctly calculate macros and micros for base weight (100g)")
    void mealItem_shouldCalculateMacrosForBaseWeight() {
        // Arrange
        FoodNutrients baseNutrients = createDummyNutrients(250.0, 10.0, 30.0, 5.0, 400.0);

        // Act
        MealItem item = MealItem.create(baseNutrients, 100.0);

        // Assert - Multiplier is 1.0
        assertEquals(250.0, item.getCalories());
        assertEquals(10.0, item.getProteins());
        assertEquals(30.0, item.getCarbohydrates());
        assertEquals(5.0, item.getFats());
        assertEquals(400.0, item.getSodiumMg());
    }

    @Test
    @DisplayName("MealItem should correctly multiply macros and micros when consuming 250g")
    void mealItem_shouldCalculateMacrosForCustomWeight() {
        // Arrange
        FoodNutrients baseNutrients = createDummyNutrients(100.0, 10.0, 20.0, 5.0, 100.0);

        // Act - Multiplier should be 2.5
        MealItem item = MealItem.create(baseNutrients, 250.0);

        // Assert
        assertEquals(250.0, item.getCalories(), 0.01);
        assertEquals(25.0, item.getProteins(), 0.01);
        assertEquals(50.0, item.getCarbohydrates(), 0.01);
        assertEquals(12.5, item.getFats(), 0.01);
        assertEquals(250.0, item.getSodiumMg(), 0.01);
    }

    @Test
    @DisplayName("MealLog should aggregate totals correctly from multiple MealItems")
    void mealLog_shouldAggregateTotalsCorrectly() {
        // Arrange
        FoodNutrients nutrients1 = createDummyNutrients(100.0, 10.0, 20.0, 5.0, 100.0);
        MealItem item1 = MealItem.create(nutrients1, 200.0); // Will contribute 200 cals, 20 proteins

        FoodNutrients nutrients2 = createDummyNutrients(50.0, 5.0, 10.0, 2.0, 50.0);
        MealItem item2 = MealItem.create(nutrients2, 100.0); // Will contribute 50 cals, 5 proteins

        // Act
        MealLog log = MealLog.create("user-1", MealType.LUNCH, LocalDateTime.now(), "photo.jpg", List.of(item1, item2));

        // Assert - The aggregate root should sum up all children
        assertEquals(250.0, log.getTotalCalories(), 0.01);
        assertEquals(25.0, log.getTotalProteins(), 0.01);
        assertEquals(50.0, log.getTotalCarbs(), 0.01);
        assertEquals(12.0, log.getTotalFats(), 0.01);
        assertEquals(2, log.getItems().size());
    }

    @Test
    @DisplayName("Domain validation: Should throw InvalidDomainDataException for invalid states")
    void domain_shouldThrowExceptionForInvalidStates() {
        // Arrange
        FoodNutrients nutrients = createDummyNutrients(100, 10, 10, 10, 10);

        // Act & Assert 1: MealItem with zero or negative grams
        InvalidDomainDataException itemException = assertThrows(
                InvalidDomainDataException.class,
                () -> MealItem.create(nutrients, 0.0)
        );
        assertTrue(itemException.getMessage().contains("strictly positive"));

        assertThrows(InvalidDomainDataException.class, () -> MealItem.create(nutrients, -50.0));

        // Act & Assert 2: MealLog with empty or null items
        InvalidDomainDataException logException1 = assertThrows(
                InvalidDomainDataException.class,
                () -> MealLog.create("user-1", MealType.SNACK, LocalDateTime.now(), null, Collections.emptyList())
        );
        assertTrue(logException1.getMessage().contains("at least one food item"));

        assertThrows(
                InvalidDomainDataException.class,
                () -> MealLog.create("user-1", MealType.SNACK, LocalDateTime.now(), null, null)
        );
    }
}