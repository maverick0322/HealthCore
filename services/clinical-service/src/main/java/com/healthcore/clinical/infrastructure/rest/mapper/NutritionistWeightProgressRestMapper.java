package com.healthcore.clinical.infrastructure.rest.mapper;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressReportResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressRowResponse;

@Component
public class NutritionistWeightProgressRestMapper {

    public NutritionistWeightProgressReportResponse toResponse(NutritionistWeightProgressReport report) {
        return new NutritionistWeightProgressReportResponse(
                report.activePatients(),
                report.patientsWithoutWeightInRange(),
                report.rows().stream()
                        .map(this::toRowResponse)
                        .toList()
        );
    }

    private NutritionistWeightProgressRowResponse toRowResponse(NutritionistWeightProgressRow row) {
        return new NutritionistWeightProgressRowResponse(
                row.patientId(),
                row.fullName(),
                row.latestRecordDateInRange(),
                row.startWeightKg(),
                row.currentWeightKg(),
                row.netChangeKg(),
                row.hasRecordsInRange()
        );
    }
}
