package com.healthcore.clinical.infrastructure.rest.dto;

import java.time.LocalDateTime;

public record ObservationResponse(
    String id,
    String patientId,
    String nutritionistId,
    String note,
    LocalDateTime createdAt
) {}