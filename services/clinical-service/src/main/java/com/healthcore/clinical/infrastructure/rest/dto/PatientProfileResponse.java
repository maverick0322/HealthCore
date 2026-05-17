package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;
import java.util.List;

public record PatientProfileResponse(
        String userId,
        String firstName,
        String paternalLastName,
        String maternalLastName,
        String fullName,
        Double weightKg,
        Double heightCm,
        LocalDate birthDate,
        String gender,
        String activityLevel,
        String goal,
        String dietType,
        List<String> allergies,
        List<String> excludedFoods,
        String nutritionistId,
        boolean profileCompleted
) {
}
