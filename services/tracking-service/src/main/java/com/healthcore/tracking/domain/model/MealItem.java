package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import lombok.Builder;
import lombok.Getter;

/**
 * Child Entity within the MealLog Aggregate.
 * Encapsulates the mathematical logic for prorating nutrients based on consumed grams.
 * This prevents calculation logic from leaking into Application or Infrastructure layers.
 */
@Getter
@Builder(toBuilder = true)
public class MealItem {

    private static final double BASE_WEIGHT_GRAMS = 100.0;

    private final String barcode;
    private final String foodName;
    private final double consumedGrams;

    // Prorated macros
    private final double calories;
    private final double proteins;
    private final double carbohydrates;
    private final double fats;

    // Prorated micros
    private final double fiberGrams;
    private final double sodiumMg;
    private final double sugarGrams;
    private final double potassiumMg;

    /**
     * Factory method enforcing business invariants and performing exact nutritional math.
     */
    public static MealItem create(FoodNutrients baseNutrients, double consumedGrams) {
        if (consumedGrams <= 0) {
            throw new InvalidDomainDataException("Consumed grams must be strictly positive.");
        }

        double multiplier = consumedGrams / BASE_WEIGHT_GRAMS;

        return MealItem.builder()
                .barcode(baseNutrients.barcode())
                .foodName(baseNutrients.name())
                .consumedGrams(consumedGrams)
                .calories(baseNutrients.calories() * multiplier)
                .proteins(baseNutrients.proteins() * multiplier)
                .carbohydrates(baseNutrients.carbohydrates() * multiplier)
                .fats(baseNutrients.fats() * multiplier)
                .fiberGrams(baseNutrients.fiberGrams() * multiplier)
                .sodiumMg(baseNutrients.sodiumMg() * multiplier)
                .sugarGrams(baseNutrients.sugarGrams() * multiplier)
                .potassiumMg(baseNutrients.potassiumMg() * multiplier)
                .build();
    }
}