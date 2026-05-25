package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record UpdatePatientMetricsRequest(
        @NotNull(message = "Weight is required")
        @DecimalMin(value = "40.0", message = "Weight must be at least 40.0 kg")
        @DecimalMax(value = "200.0", message = "Weight must be at most 200.0 kg")
        Double weightKg,

        @NotNull(message = "Height is required")
        @DecimalMin(value = "100.0", message = "Height must be at least 100 cm")
        @DecimalMax(value = "250.0", message = "Height must be at most 250 cm")
        Double heightCm
) {
}
