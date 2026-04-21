package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDate;

public record CreateProfileRequest(
    Double weightKg,
    Double heightCm,
    LocalDate birthDate,
    String gender,
    String activityLevel
) {}