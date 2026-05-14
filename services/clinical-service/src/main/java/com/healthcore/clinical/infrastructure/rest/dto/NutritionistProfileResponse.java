package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

public record NutritionistProfileResponse(
        String userId,
        String firstName,
        String paternalLastName,
        String maternalLastName,
        String fullName,
        List<String> specializations,
        String customSpecialization,
        String professionalLicense,
        List<String> consultationTypes,
        String phone,
        ClinicAddressResponse clinicAddress,
        String bio,
        boolean profileCompleted
) {
}
