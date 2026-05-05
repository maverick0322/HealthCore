package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Request DTO para crear un nuevo perfil clínico de paciente.
 * 
 * Validaciones:
 * - Peso: Entre 30.0 kg y 300.0 kg
 * - Altura: Entre 50.0 cm y 250.0 cm
 * - Todos los campos son obligatorios
 */
public record CreateProfileRequest(
    @NotNull(message = "Peso es requerido")
    @DecimalMin(value = "30.0", message = "Peso mínimo permitido es 30.0 kg")
    @DecimalMax(value = "300.0", message = "Peso máximo permitido es 300.0 kg")
    Double weightKg,

    @NotNull(message = "Altura es requerida")
    @DecimalMin(value = "50.0", message = "Altura mínima permitida es 50.0 cm")
    @DecimalMax(value = "250.0", message = "Altura máxima permitida es 250.0 cm")
    Double heightCm,

    @NotNull(message = "Fecha de nacimiento es requerida")
    LocalDate birthDate,

    @NotBlank(message = "Género es requerido")
    String gender,

    @NotBlank(message = "Nivel de actividad es requerido")
    String activityLevel
) {}