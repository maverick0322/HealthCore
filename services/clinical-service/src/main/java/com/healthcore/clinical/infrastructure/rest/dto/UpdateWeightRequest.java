package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO para actualizar el peso de un paciente.
 * 
 * Validaciones:
 * - Peso: Entre 30.0 kg y 300.0 kg
 * - Campo obligatorio
 */
public record UpdateWeightRequest(
    @NotNull(message = "Peso es requerido")
    @DecimalMin(value = "30.0", message = "Peso mínimo permitido es 30.0 kg")
    @DecimalMax(value = "300.0", message = "Peso máximo permitido es 300.0 kg")
    Double weightKg
) {}