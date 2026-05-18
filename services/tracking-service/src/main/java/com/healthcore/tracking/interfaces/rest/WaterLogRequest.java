package com.healthcore.tracking.interfaces.rest;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for incoming water log requests.
 * Uses Jakarta Validation to enforce fail-fast data integrity at the REST edge.
 */
public record WaterLogRequest(
        @NotNull(message = "Amount in milliliters cannot be null")
        @Min(value = 1, message = "Water amount must be at least 1 ml")
        @Max(value = 5000, message = "Water amount exceeds reasonable human limits per log (max 5000 ml)")
        Integer amountMl,

        // Optional: If null, the Domain Factory will default to LocalDateTime.now()
        LocalDateTime consumedAt
) {}