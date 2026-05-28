package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "HealthGoalResponse", description = "Calculated daily goals derived from a patient clinical profile.")
public record HealthGoalResponse(
        @Schema(description = "Daily calorie target", example = "2300")
        Integer targetCalories,
        @Schema(description = "Daily protein target in grams", example = "140")
        Integer targetProtein,
        @Schema(description = "Daily carbohydrate target in grams", example = "230")
        Integer targetCarbs,
        @Schema(description = "Daily fat target in grams", example = "60")
        Integer targetFat,
        @Schema(description = "Daily water target in glasses", example = "10")
        Integer targetWaterGlasses
) {}
