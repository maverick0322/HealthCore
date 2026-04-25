package com.healthcore.tracking.domain.model;

import com.healthcore.tracking.domain.exception.InvalidDomainDataException;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Aggregate Root representing a user's food consumption event.
 * Completely agnostic of databases or frameworks (No Spring annotations).
 */
@Getter
@Builder(toBuilder = true)
public class FoodLog {

    private static final double BASE_WEIGHT_GRAMS = 100.0;

    private final String id;
    private final String userId;
    private final String barcode;
    private final String foodName;
    private final double consumedGrams;
    private final double totalCalories;
    private final double totalProteins;
    private final double totalCarbs;
    private final double totalFats;
    private final LocalDateTime consumedAt;

    /**
     * Factory method enforcing business rules and macro calculations.
     * Ensures an invalid or mathematically incorrect FoodLog can never be instantiated.
     */
    public static FoodLog create(String userId, FoodNutrients nutrients, double consumedGrams, LocalDateTime consumedAt) {
        if (consumedGrams <= 0) {
            throw new InvalidDomainDataException("Consumed grams must be strictly positive.");
        }

        // We calculate totals inside the domain, service layer does not do math, just orchestrates.
        double multiplier = consumedGrams / BASE_WEIGHT_GRAMS;

        return FoodLog.builder()
                .userId(userId)
                .barcode(nutrients.getBarcode())
                .foodName(nutrients.getName())
                .consumedGrams(consumedGrams)
                .totalCalories(nutrients.getCalories() * multiplier)
                .totalProteins(nutrients.getProteins() * multiplier)
                .totalCarbs(nutrients.getCarbohydrates() * multiplier)
                .totalFats(nutrients.getFats() * multiplier)
                .consumedAt(consumedAt != null ? consumedAt : LocalDateTime.now())
                .build();
    }
}