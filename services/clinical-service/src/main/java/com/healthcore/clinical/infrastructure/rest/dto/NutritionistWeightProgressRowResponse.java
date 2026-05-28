package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionistWeightProgressRowResponse", description = "Single patient row inside the nutritionist weight progress report.")
public record NutritionistWeightProgressRowResponse(
        @Schema(description = "Patient identifier", example = "patient-123")
        String patientId,
        @Schema(description = "Patient full name", example = "Carlos Gomez")
        String fullName,
        @Schema(description = "Latest weight record date within the requested range", example = "2026-05-27")
        LocalDate latestRecordDateInRange,
        @Schema(description = "Starting weight within the requested range", example = "75.0")
        Double startWeightKg,
        @Schema(description = "Current weight within the requested range", example = "72.5")
        Double currentWeightKg,
        @Schema(description = "Net change in kilograms within the requested range", example = "-2.5")
        Double netChangeKg,
        @Schema(description = "Whether the patient has at least one weight record in the requested range", example = "true")
        boolean hasRecordsInRange
) {
}
