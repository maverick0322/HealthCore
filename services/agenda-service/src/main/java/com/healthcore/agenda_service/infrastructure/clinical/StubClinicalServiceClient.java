package com.healthcore.agenda_service.infrastructure.clinical;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class StubClinicalServiceClient implements ClinicalServiceClient {

    private final boolean allowAll;

    public StubClinicalServiceClient(@Value("${agenda.clinical.allow-all:true}") boolean allowAll) {
        this.allowAll = allowAll;
    }

    @Override
    public boolean validateLink(String patientId, String nutritionistId) {
        // First iteration keeps a local stub; swap this for generated gRPC client in the integration iteration.
        return allowAll;
    }
}

