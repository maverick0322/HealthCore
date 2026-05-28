package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionPlanViewResponse", description = "Nutrition plan view resolved for a patient or nutritionist.")
public record NutritionPlanViewResponse(
        @Schema(description = "View mode returned by the service", example = "SELF_MANAGED")
        String mode,
        @Schema(description = "Author type for the editable plan", example = "SELF_MANAGED")
        String authorType,
        @Schema(description = "Whether the current actor can edit the returned plan", example = "true")
        boolean canEdit,
        @Schema(description = "Daily goals linked to the plan")
        HealthGoalResponse dailyGoals,
        @Schema(description = "Meal sections included in the plan")
        List<NutritionPlanSectionResponse> sections,
        @Schema(description = "Optional read-only self-managed plan context")
        ReadonlyNutritionPlanResponse contextSelfManagedPlan
) {}
