package com.healthcore.tracking.interfaces.rest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * DTO for incoming food consumption requests.
 * Modeled as a Java Record for absolute immutability and thread-safety.
 */
public record FoodLogRequest(
        @NotBlank(message = "Barcode is required and cannot be blank.")
        String barcode,

        @Positive(message = "Consumption amount must be strictly positive.")
        double grams
) {}