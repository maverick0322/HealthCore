package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;

public record NutritionistWeightProgressRowResponse(
        String patientId,
        String fullName,
        LocalDate latestRecordDateInRange,
        Double startWeightKg,
        Double currentWeightKg,
        Double netChangeKg,
        boolean hasRecordsInRange
) {
}
