package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.NutritionistWeightProgressReportFactory;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class NutritionistWeightProgressApplicationService {

    private final PatientProfileAccessService patientProfileAccessService;
    private final NutritionistWeightProgressReportFactory nutritionistWeightProgressReportFactory;

    public NutritionistWeightProgressApplicationService(
            PatientProfileAccessService patientProfileAccessService,
            NutritionistWeightProgressReportFactory nutritionistWeightProgressReportFactory
    ) {
        this.patientProfileAccessService = patientProfileAccessService;
        this.nutritionistWeightProgressReportFactory = nutritionistWeightProgressReportFactory;
    }

    public NutritionistWeightProgressReport getNutritionistWeightProgressReport(
            String nutritionistId,
            LocalDate from,
            LocalDate to
    ) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new IllegalArgumentException("Invalid report range.");
        }

        return nutritionistWeightProgressReportFactory.create(
                patientProfileAccessService.findAllByNutritionistId(nutritionistId),
                from,
                to
        );
    }
}
