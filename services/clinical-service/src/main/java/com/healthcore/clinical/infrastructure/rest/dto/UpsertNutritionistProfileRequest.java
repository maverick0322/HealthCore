package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpsertNutritionistProfileRequest(
        @NotBlank(message = "First name is required")
        String firstName,

        @NotBlank(message = "Paternal last name is required")
        String paternalLastName,

        String maternalLastName,

        @NotEmpty(message = "At least one specialization is required")
        List<String> specializations,

        String customSpecialization,

        @NotBlank(message = "Professional license is required")
        String professionalLicense,

        @NotEmpty(message = "At least one consultation type is required")
        List<String> consultationTypes,

        String phone,

        ClinicAddressRequest clinicAddress,

        @NotBlank(message = "Bio is required")
        String bio
) {
}
