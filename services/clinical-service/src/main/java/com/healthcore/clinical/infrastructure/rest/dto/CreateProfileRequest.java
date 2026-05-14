package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateProfileRequest(
        @NotBlank(message = "First name is required")
        String firstName,

        @NotBlank(message = "Paternal last name is required")
        String paternalLastName,

        String maternalLastName,

        @NotNull(message = "Weight is required")
        @DecimalMin(value = "40.0", message = "Weight must be at least 40.0 kg")
        @DecimalMax(value = "200.0", message = "Weight must be at most 200.0 kg")
        Double weightKg,

        @NotNull(message = "Height is required")
        @DecimalMin(value = "100.0", message = "Height must be at least 100 cm")
        @DecimalMax(value = "250.0", message = "Height must be at most 250 cm")
        Double heightCm,

        @NotNull(message = "Birth date is required")
        LocalDate birthDate,

        @NotBlank(message = "Gender is required")
        String gender,

        @NotBlank(message = "Activity level is required")
        String activityLevel,

        @NotBlank(message = "Goal is required")
        String goal,

        @NotBlank(message = "Diet type is required")
        String dietType,

        List<String> allergies,

        List<String> excludedFoods
) {
}
