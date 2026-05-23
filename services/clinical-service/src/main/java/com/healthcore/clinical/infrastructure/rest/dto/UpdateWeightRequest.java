package com.healthcore.clinical.infrastructure.rest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

/**
 * Request DTO para actualizar el peso de un paciente.
 *
 * Validaciones:
 * - Peso: Entre 40.0 kg y 200.0 kg
 * - Fecha obligatoria y no futura
 */
public record UpdateWeightRequest(
    @NotNull(message = "Peso es requerido")
    @DecimalMin(value = "40.0", message = "Peso minimo permitido es 40.0 kg")
    @DecimalMax(value = "200.0", message = "Peso maximo permitido es 200.0 kg")
    Double weightKg,
    @NotNull(message = "La fecha es obligatoria")
    @PastOrPresent(message = "La fecha no puede estar en el futuro")
    LocalDate date
) {}
