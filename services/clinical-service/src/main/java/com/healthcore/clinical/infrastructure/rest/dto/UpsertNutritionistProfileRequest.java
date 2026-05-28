package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Schema(name = "UpsertNutritionistProfileRequest", description = "Payload used to create or update a nutritionist public profile.")
public record UpsertNutritionistProfileRequest(
        @Schema(description = "Nutritionist first name", example = "Daniel")
        @NotBlank(message = "First name is required")
        String firstName,

        @Schema(description = "Nutritionist paternal last name", example = "Martinez")
        @NotBlank(message = "Paternal last name is required")
        String paternalLastName,

        @Schema(description = "Nutritionist maternal last name", example = "Rivera")
        String maternalLastName,

        @Schema(description = "List of declared specializations", example = "[\"CLINICAL\",\"SPORTS\"]")
        @NotEmpty(message = "At least one specialization is required")
        List<String> specializations,

        @Schema(description = "Custom specialization when a predefined value is not enough", example = "Pediatric nutrition")
        String customSpecialization,

        @Schema(description = "Professional license number", example = "12345678")
        @NotBlank(message = "Professional license is required")
        String professionalLicense,

        @Schema(description = "Supported consultation types", example = "[\"PRESENTIAL\",\"ONLINE\"]")
        @NotEmpty(message = "At least one consultation type is required")
        List<String> consultationTypes,

        @Schema(description = "Public contact phone", example = "5512345678")
        String phone,

        @Schema(description = "Clinic address details")
        ClinicAddressRequest clinicAddress,

        @Schema(description = "Short public biography", example = "Clinical nutrition specialist focused on long-term behavior change.")
        @NotBlank(message = "Bio is required")
        String bio
) {
}
