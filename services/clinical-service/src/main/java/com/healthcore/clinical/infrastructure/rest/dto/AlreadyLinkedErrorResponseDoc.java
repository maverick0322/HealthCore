package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "AlreadyLinkedErrorResponse", description = "Conflict response returned when a patient is already linked to another nutritionist.")
public record AlreadyLinkedErrorResponseDoc(
        @Schema(description = "Timestamp when the error response was generated", example = "2026-05-27T19:20:14.864")
        String timestamp,
        @Schema(description = "HTTP status code", example = "409")
        int status,
        @Schema(description = "Short error label", example = "Already Linked")
        String error,
        @Schema(description = "Detailed error message", example = "Patient is already linked to another nutritionist")
        String message,
        @Schema(description = "Identifier of the nutritionist currently linked to the patient", example = "nutri-999")
        String currentNutritionistId
) {
}
