package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

@Schema(name = "ValidationErrorResponse", description = "Validation error payload with field-level details.")
public record ValidationErrorResponseDoc(
        @Schema(description = "Timestamp when the validation error was generated", example = "2026-05-27T19:20:14.864")
        String timestamp,
        @Schema(description = "HTTP status code", example = "400")
        int status,
        @Schema(description = "Short error label", example = "Validation Error")
        String error,
        @Schema(description = "General validation message", example = "The provided payload does not satisfy validation rules")
        String message,
        @Schema(description = "Field-level validation messages", example = "{\"weightKg\":\"Weight must be at least 40.0 kg\"}")
        Map<String, String> errors
) {
}
