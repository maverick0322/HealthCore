package com.healthcore.agenda_service.infrastructure.clinical;

public interface ClinicalServiceClient {
    boolean validateLink(String patientId, String nutritionistId);
}

