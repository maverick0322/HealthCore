package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "UpdateObservationRequest", description = "Payload used to update an existing clinical observation.")
public record UpdateObservationRequest(
        @Schema(description = "Updated clinical note content", example = "Patient improved compliance after replacing the evening snack.")
        @NotBlank(message = "Observation note is required")
        @Size(max = 500, message = "Observation note must be at most 500 characters long")
        String note
) {
}
