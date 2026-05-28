package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ObservationResponse", description = "Clinical observation returned by the service.")
public record ObservationResponse(
    @Schema(description = "Observation identifier", example = "obs-1")
    String id,
    @Schema(description = "Patient identifier", example = "patient-123")
    String patientId,
    @Schema(description = "Nutritionist identifier", example = "nutri-123")
    String nutritionistId,
    @Schema(description = "Clinical note text", example = "Patient shows good adherence to the current breakfast plan.")
    String note,
    @Schema(description = "Creation timestamp", example = "2026-05-27T09:30:00")
    LocalDateTime createdAt
) {}
