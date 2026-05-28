package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "PatientProfileResponse", description = "Patient clinical profile returned by the clinical service.")
public record PatientProfileResponse(
        @Schema(description = "Patient user identifier", example = "patient-123")
        String userId,
        @Schema(description = "Patient first name", example = "Carlos")
        String firstName,
        @Schema(description = "Patient paternal last name", example = "Gomez")
        String paternalLastName,
        @Schema(description = "Patient maternal last name", example = "Lopez")
        String maternalLastName,
        @Schema(description = "Convenience full name", example = "Carlos Gomez Lopez")
        String fullName,
        @Schema(description = "Current patient weight in kilograms", example = "75.5")
        Double weightKg,
        @Schema(description = "Current patient height in centimeters", example = "175.0")
        Double heightCm,
        @Schema(description = "Patient birth date", example = "1995-01-15")
        LocalDate birthDate,
        @Schema(description = "Patient gender enum value", example = "MALE")
        String gender,
        @Schema(description = "Patient activity level enum value", example = "MODERATELY_ACTIVE")
        String activityLevel,
        @Schema(description = "Primary goal configured in the profile", example = "weight-loss")
        String goal,
        @Schema(description = "Diet type followed by the patient", example = "omnivore")
        String dietType,
        @Schema(description = "Declared allergies", example = "[\"gluten\"]")
        List<String> allergies,
        @Schema(description = "Foods excluded by the patient", example = "[\"onion\"]")
        List<String> excludedFoods,
        @Schema(description = "Linked nutritionist identifier", example = "nutri-123")
        String nutritionistId,
        @Schema(description = "Resolved public URL for the profile photo", example = "https://cdn.example.com/patient-123/avatar.webp")
        String profilePhotoUrl,
        @Schema(description = "Whether the profile satisfies completion rules", example = "true")
        boolean profileCompleted
) {
}
