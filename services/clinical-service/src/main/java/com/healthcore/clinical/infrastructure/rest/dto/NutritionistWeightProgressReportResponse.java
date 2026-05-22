package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

public record NutritionistWeightProgressReportResponse(
        int activePatients,
        int patientsWithoutWeightInRange,
        List<NutritionistWeightProgressRowResponse> rows
) {
}
