package com.healthcore.clinical.infrastructure.rest.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "NutritionistProfileResponse", description = "Nutritionist public profile returned by the clinical service.")
public record NutritionistProfileResponse(
        @Schema(description = "Nutritionist user identifier", example = "nutri-123")
        String userId,
        @Schema(description = "Nutritionist first name", example = "Daniel")
        String firstName,
        @Schema(description = "Nutritionist paternal last name", example = "Martinez")
        String paternalLastName,
        @Schema(description = "Nutritionist maternal last name", example = "Rivera")
        String maternalLastName,
        @Schema(description = "Convenience full name", example = "Daniel Martinez Rivera")
        String fullName,
        @Schema(description = "Declared specializations", example = "[\"CLINICAL\",\"SPORTS\"]")
        List<String> specializations,
        @Schema(description = "Custom specialization text", example = "Pediatric nutrition")
        String customSpecialization,
        @Schema(description = "Professional license number", example = "12345678")
        String professionalLicense,
        @Schema(description = "Supported consultation types", example = "[\"PRESENTIAL\",\"ONLINE\"]")
        List<String> consultationTypes,
        @Schema(description = "Public contact phone", example = "5512345678")
        String phone,
        @Schema(description = "Clinic address details")
        ClinicAddressResponse clinicAddress,
        @Schema(description = "Short public biography", example = "Clinical nutrition specialist focused on long-term behavior change.")
        String bio,
        @Schema(description = "Resolved public URL for the profile photo", example = "https://cdn.example.com/nutri-123/avatar.webp")
        String profilePhotoUrl,
        @Schema(description = "Whether the profile satisfies completion rules", example = "true")
        boolean profileCompleted
) {
}
