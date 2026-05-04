package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateWeightRequest(
    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be positive")
    Double weightKg
) {}