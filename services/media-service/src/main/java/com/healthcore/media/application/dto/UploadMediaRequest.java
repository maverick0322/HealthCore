package com.healthcore.media.application.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for URL signed generation request
 */
public record UploadMediaRequest(
        @Schema(
                description = "El nombre original del archivo a subir. Debe contener una extensión válida y no contener rutas relativas.",
                example = "radiografia-torax.png"
        )
        @NotBlank(message = "El nombre del archivo no puede estar vacío.")
        @Pattern(
                regexp = "^[a-zA-Z0-9_\\-]+\\.(jpg|jpeg|png|webp|pdf)$",
                message = "Formato o nombre de archivo no permitido. Solo se aceptan caracteres alfanuméricos y extensiones válidas."
        )
        String fileName
) {}