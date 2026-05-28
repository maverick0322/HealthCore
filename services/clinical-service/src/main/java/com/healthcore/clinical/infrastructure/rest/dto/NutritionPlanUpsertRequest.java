package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(name = "NutritionPlanUpsertRequest", description = "Payload used to create or replace a nutrition plan.")
public record NutritionPlanUpsertRequest(
        @Schema(description = "Exactly four meal sections for the plan")
        @Valid @NotNull @Size(min = 4, max = 4) List<NutritionPlanSectionRequest> sections
) {}
