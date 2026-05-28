package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "UnauthorizedErrorResponse", description = "Unauthorized response emitted by the JWT validation filter.")
public record UnauthorizedErrorResponseDoc(
        @Schema(description = "Application-level error code", example = "UNAUTHORIZED")
        String code,
        @Schema(description = "Detailed error message", example = "Invalid or expired token")
        String message
) {
}
