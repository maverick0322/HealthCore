package com.healthcore.media.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for URL signed generation request
 */
public record UploadMediaRequest(
        @NotBlank(message = "El nombre del archivo no puede estar vacío.")
        @Pattern(
                regexp = "^[a-zA-Z0-9_\\-]+\\.(jpg|jpeg|png|webp|pdf)$",
                message = "Formato o nombre de archivo no permitido. Solo se aceptan caracteres alfanuméricos y extensiones válidas."
        )
        String fileName
) {}