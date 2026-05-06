package com.healthcore.tracking.domain.model;

import java.io.Serializable;

/**
 * Value Object representing the nutritional profile of a food item per standard base weight (100g).
 * Modeled as a Record for immutability, ensuring data integrity across the application.
 */
public record FoodNutrients(
        String barcode,
        String name,
        String brand,
        String imageUrl,
        double calories,
        double proteins,
        double carbohydrates,
        double fats,
        double fiberGrams,
        double sodiumMg,
        double sugarGrams,
        double potassiumMg
) implements Serializable {}