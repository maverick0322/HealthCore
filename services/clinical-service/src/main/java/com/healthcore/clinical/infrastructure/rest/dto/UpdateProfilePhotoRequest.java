package com.healthcore.clinical.infrastructure.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "UpdateProfilePhotoRequest", description = "Payload used to attach a previously uploaded media storage key to a profile.")
public record UpdateProfilePhotoRequest(
        @Schema(description = "Storage key previously returned by media-service", example = "patient-123/profile/avatar.webp")
        @NotBlank(message = "Profile photo key is required")
        String profilePhotoKey
) {
}
