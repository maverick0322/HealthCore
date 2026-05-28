package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ApiErrorResponse", description = "Standard error payload returned by the clinical service.")
public record ApiErrorResponseDoc(
        @Schema(description = "Timestamp when the error response was generated", example = "2026-05-27T19:20:14.864")
        String timestamp,
        @Schema(description = "HTTP status code", example = "404")
        int status,
        @Schema(description = "Short error label", example = "Not Found")
        String error,
        @Schema(description = "Detailed error message", example = "Patient profile not found.")
        String message
) {
}
