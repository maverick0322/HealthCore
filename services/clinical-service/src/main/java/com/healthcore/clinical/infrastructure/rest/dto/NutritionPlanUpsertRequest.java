package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record NutritionPlanUpsertRequest(
        @Valid @NotNull @Size(min = 4, max = 4) List<NutritionPlanSectionRequest> sections
) {}
