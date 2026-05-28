package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(name = "NutritionPlanSectionRequest", description = "A meal section inside a nutrition plan.")
public record NutritionPlanSectionRequest(
        @Schema(description = "Meal slot enum value", example = "BREAKFAST")
        @NotBlank String mealSlot,
        @Schema(description = "Meal options available for the section")
        @Valid @NotNull List<NutritionPlanMealOptionRequest> options
) {}
