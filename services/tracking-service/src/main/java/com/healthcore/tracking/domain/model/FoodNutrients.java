package com.healthcore.tracking.domain.model;

import lombok.Builder;
import lombok.Getter;
import java.io.Serializable;

/**
 * Value Object representing the nutritional profile of a food item per 100g.
 * Immutable design: Uses @Getter instead of @Data to prevent state mutation after creation.
 */
@Getter
@Builder
public class FoodNutrients implements  Serializable {
    private final String barcode;
    private final String name;
    private final String brand;
    private final String imageUrl;
    private final double calories;
    private final double proteins;
    private final double carbohydrates;
    private final double fats;
    private final String source;
}