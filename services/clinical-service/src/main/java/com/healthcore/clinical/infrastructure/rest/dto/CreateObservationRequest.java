package com.healthcore.clinical.infrastructure.rest.dto;

public record CreateObservationRequest(
    String patientId,
    String note
) {}