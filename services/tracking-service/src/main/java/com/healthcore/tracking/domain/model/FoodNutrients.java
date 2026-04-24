package com.healthcore.tracking.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodNutrients {

    private String name;
    private String brand;
    private double calories;
    private double proteins;
    private double carbohydrates;
    private double fats;
    private String source;

}