package com.healthcore.tracking.infrastructure.persistence.entity;

import lombok.Builder;
import lombok.Data;

// Notice: No @Document here, this will be embedded inside MealLogDocument
@Data
@Builder
public class MealItemDocument {
    private String barcode;
    private String foodName;
    private double consumedGrams;

    private double calories;
    private double proteins;
    private double carbohydrates;
    private double fats;
    private double fiberGrams;
    private double sodiumMg;
    private double sugarGrams;
    private double potassiumMg;
}