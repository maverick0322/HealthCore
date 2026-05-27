package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfilePhotoRequest(
        @NotBlank(message = "Profile photo key is required")
        String profilePhotoKey
) {
}
