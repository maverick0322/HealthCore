package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionistWeightProgressReportResponse", description = "Consolidated weight progress report returned for a nutritionist.")
public record NutritionistWeightProgressReportResponse(
        @Schema(description = "Number of active linked patients considered in the report", example = "12")
        int activePatients,
        @Schema(description = "Number of patients without weight records in the requested range", example = "3")
        int patientsWithoutWeightInRange,
        @Schema(description = "Detailed patient rows")
        List<NutritionistWeightProgressRowResponse> rows
) {
}
