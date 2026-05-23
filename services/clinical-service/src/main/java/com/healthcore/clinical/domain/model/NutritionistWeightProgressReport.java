package com.healthcore.clinical.domain.model;

import java.util.List;

public record NutritionistWeightProgressReport(
        int activePatients,
        int patientsWithoutWeightInRange,
        List<NutritionistWeightProgressRow> rows
) {
}
