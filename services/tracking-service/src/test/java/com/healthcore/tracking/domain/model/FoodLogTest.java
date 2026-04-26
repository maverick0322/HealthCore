package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class FoodLogTest {

    @Test
    @DisplayName("Should correctly calculate macros when consuming exactly 100g")
    void shouldCalculateMacrosForBaseWeight() {
        // Arrange
        FoodNutrients baseNutrients = FoodNutrients.builder()
                .barcode("12345")
                .name("Test Food")
                .calories(250.0)
                .proteins(10.0)
                .carbohydrates(30.0)
                .fats(5.0)
                .build();

        // Act
        FoodLog log = FoodLog.create("user-1", baseNutrients, 100.0, LocalDateTime.now());

        // Assert
        assertEquals(250.0, log.getTotalCalories());
        assertEquals(10.0, log.getTotalProteins());
        assertEquals(30.0, log.getTotalCarbs());
        assertEquals(5.0, log.getTotalFats());
    }

    @Test
    @DisplayName("Should correctly multiply macros when consuming 250g")
    void shouldCalculateMacrosForCustomWeight() {
        // Arrange
        FoodNutrients baseNutrients = FoodNutrients.builder()
                .calories(100.0)
                .proteins(10.0)
                .carbohydrates(20.0)
                .fats(5.0)
                .build();

        // Act (Multiplier should be 2.5)
        FoodLog log = FoodLog.create("user-1", baseNutrients, 250.0, LocalDateTime.now());

        // Assert
        assertEquals(250.0, log.getTotalCalories(), 0.01);
        assertEquals(25.0, log.getTotalProteins(), 0.01);
        assertEquals(50.0, log.getTotalCarbs(), 0.01);
        assertEquals(12.5, log.getTotalFats(), 0.01);
    }

    @Test
    @DisplayName("Should throw InvalidDomainDataException when grams are zero or negative")
    void shouldThrowExceptionForInvalidGrams() {
        // Arrange
        FoodNutrients nutrients = FoodNutrients.builder().build();

        // Act & Assert
        InvalidDomainDataException exception = assertThrows(
                InvalidDomainDataException.class,
                () -> FoodLog.create("user-1", nutrients, 0.0, LocalDateTime.now())
        );
        assertTrue(exception.getMessage().contains("strictly positive"));

        assertThrows(
                InvalidDomainDataException.class,
                () -> FoodLog.create("user-1", nutrients, -50.0, LocalDateTime.now())
        );
    }
}