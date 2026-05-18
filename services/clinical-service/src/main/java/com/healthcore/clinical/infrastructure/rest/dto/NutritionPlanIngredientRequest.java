package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record NutritionPlanIngredientRequest(
        @NotBlank String barcode,
        @NotBlank String unit,
        @NotNull @Positive Double quantityAmount
) {}
