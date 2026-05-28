package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(name = "CreateProfileRequest", description = "Payload used to create or fully replace a patient clinical profile.")
public record CreateProfileRequest(
        @Schema(description = "Patient first name", example = "Carlos")
        @NotBlank(message = "First name is required")
        String firstName,

        @Schema(description = "Patient paternal last name", example = "Gomez")
        @NotBlank(message = "Paternal last name is required")
        String paternalLastName,

        @Schema(description = "Patient maternal last name", example = "Lopez")
        String maternalLastName,

        @Schema(description = "Current patient weight in kilograms", example = "75.5")
        @NotNull(message = "Weight is required")
        @DecimalMin(value = "40.0", message = "Weight must be at least 40.0 kg")
        @DecimalMax(value = "200.0", message = "Weight must be at most 200.0 kg")
        Double weightKg,

        @Schema(description = "Current patient height in centimeters", example = "175.0")
        @NotNull(message = "Height is required")
        @DecimalMin(value = "100.0", message = "Height must be at least 100 cm")
        @DecimalMax(value = "250.0", message = "Height must be at most 250 cm")
        Double heightCm,

        @Schema(description = "Patient birth date", example = "1995-01-15")
        @NotNull(message = "Birth date is required")
        LocalDate birthDate,

        @Schema(description = "Patient gender enum value", example = "MALE")
        @NotBlank(message = "Gender is required")
        String gender,

        @Schema(description = "Patient activity level enum value", example = "MODERATELY_ACTIVE")
        @NotBlank(message = "Activity level is required")
        String activityLevel,

        @Schema(description = "Primary health goal selected by the patient", example = "weight-loss")
        @NotBlank(message = "Goal is required")
        String goal,

        @Schema(description = "Diet type currently followed by the patient", example = "omnivore")
        @NotBlank(message = "Diet type is required")
        String dietType,

        @Schema(description = "Known allergies declared by the patient", example = "[\"gluten\",\"lactose\"]")
        List<String> allergies,

        @Schema(description = "Foods the patient wants excluded from meal plans", example = "[\"onion\",\"shrimp\"]")
        List<String> excludedFoods
) {
}
