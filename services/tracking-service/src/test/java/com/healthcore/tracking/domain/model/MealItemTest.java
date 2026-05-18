package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MealItemTest {

    private FoodNutrients createBaseNutrients() {
        return new FoodNutrients(
                "7622300336738",
                "Salmón a la plancha",
                "Generic",
                "http://image.url",
                200.0, // calories
                20.0,  // proteins
                0.0,   // carbs
                13.0,  // fats
                0.0,   // fiber
                50.0,  // sodium
                0.0,   // sugar
                360.0  // potassium
        );
    }

    @Test
    void create_WithExactBaseWeight_NutrientsRemainUnchanged() {
        // Arrange
        FoodNutrients baseNutrients = createBaseNutrients();
        double consumedGrams = 100.0;

        // Act
        MealItem item = MealItem.create(baseNutrients, consumedGrams);

        // Assert
        assertThat(item.getBarcode()).isEqualTo("7622300336738");
        assertThat(item.getFoodName()).isEqualTo("Salmón a la plancha");
        assertThat(item.getConsumedGrams()).isEqualTo(100.0);
        assertThat(item.getCalories()).isEqualTo(200.0);
        assertThat(item.getProteins()).isEqualTo(20.0);
        assertThat(item.getCarbohydrates()).isEqualTo(0.0);
        assertThat(item.getFats()).isEqualTo(13.0);
    }

    @Test
    void create_WithDoubleWeight_NutrientsAreDoubled() {
        // Arrange
        FoodNutrients baseNutrients = createBaseNutrients();
        double consumedGrams = 200.0;

        // Act
        MealItem item = MealItem.create(baseNutrients, consumedGrams);

        // Assert
        assertThat(item.getConsumedGrams()).isEqualTo(200.0);
        assertThat(item.getCalories()).isEqualTo(400.0);
        assertThat(item.getProteins()).isEqualTo(40.0);
        assertThat(item.getCarbohydrates()).isEqualTo(0.0);
        assertThat(item.getFats()).isEqualTo(26.0);
        assertThat(item.getSodiumMg()).isEqualTo(100.0);
        assertThat(item.getPotassiumMg()).isEqualTo(720.0);
    }

    @Test
    void create_WithHalfWeight_NutrientsAreHalved() {
        // Arrange
        FoodNutrients baseNutrients = createBaseNutrients();
        double consumedGrams = 50.0;

        // Act
        MealItem item = MealItem.create(baseNutrients, consumedGrams);

        // Assert
        assertThat(item.getConsumedGrams()).isEqualTo(50.0);
        assertThat(item.getCalories()).isEqualTo(100.0);
        assertThat(item.getProteins()).isEqualTo(10.0);
        assertThat(item.getCarbohydrates()).isEqualTo(0.0);
        assertThat(item.getFats()).isEqualTo(6.5);
    }

    @Test
    void create_WithZeroGrams_ThrowsException() {
        // Arrange
        FoodNutrients baseNutrients = createBaseNutrients();
        double invalidGrams = 0.0;

        // Act & Assert
        assertThatThrownBy(() -> MealItem.create(baseNutrients, invalidGrams))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("Consumed grams must be strictly positive.");
    }

    @Test
    void create_WithNegativeGrams_ThrowsException() {
        // Arrange
        FoodNutrients baseNutrients = createBaseNutrients();
        double invalidGrams = -50.0;

        // Act & Assert
        assertThatThrownBy(() -> MealItem.create(baseNutrients, invalidGrams))
                .isInstanceOf(InvalidDomainDataException.class)
                .hasMessageContaining("Consumed grams must be strictly positive.");
    }
}