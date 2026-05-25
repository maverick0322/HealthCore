package com.healthcore.clinical.domain.model;

import java.time.LocalDate;

public record NutritionistWeightProgressRow(
        String patientId,
        String fullName,
        LocalDate latestRecordDateInRange,
        Double startWeightKg,
        Double currentWeightKg,
        Double netChangeKg,
        boolean hasRecordsInRange
) {
}
