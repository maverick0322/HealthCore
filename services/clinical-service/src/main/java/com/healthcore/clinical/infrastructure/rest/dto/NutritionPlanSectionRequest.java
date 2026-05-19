package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record NutritionPlanSectionRequest(
        @NotBlank String mealSlot,
        @Valid @NotNull List<NutritionPlanMealOptionRequest> options
) {}
