package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ReadonlyNutritionPlanResponse", description = "Read-only context plan returned alongside an editable nutrition plan.")
public record ReadonlyNutritionPlanResponse(
        @Schema(description = "Author type for the context plan", example = "SELF_MANAGED")
        String authorType,
        @Schema(description = "Daily goals snapshot used by the plan")
        HealthGoalResponse dailyGoals,
        @Schema(description = "Meal sections for the plan")
        List<NutritionPlanSectionResponse> sections,
        @Schema(description = "Last update timestamp", example = "2026-05-27T09:30:00")
        LocalDateTime updatedAt
) {}
