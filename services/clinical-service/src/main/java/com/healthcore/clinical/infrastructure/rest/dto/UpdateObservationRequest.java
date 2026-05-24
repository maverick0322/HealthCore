package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateObservationRequest(
        @NotBlank(message = "Observation note is required")
        @Size(max = 500, message = "Observation note must be at most 500 characters long")
        String note
) {
}
