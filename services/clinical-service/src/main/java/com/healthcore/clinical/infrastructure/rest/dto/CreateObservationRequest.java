package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "CreateObservationRequest", description = "Payload used by a nutritionist to create a clinical observation for a patient.")
public record CreateObservationRequest(
    @Schema(description = "Identifier of the target patient", example = "patient-123")
    @NotBlank(message = "Patient id is required")
    String patientId,
    @Schema(description = "Clinical note content", example = "Patient shows good adherence to the current breakfast plan.")
    @NotBlank(message = "Observation note is required")
    @Size(max = 500, message = "Observation note must be at most 500 characters long")
    String note
) {}
