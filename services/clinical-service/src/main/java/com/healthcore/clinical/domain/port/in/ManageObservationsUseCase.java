package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import java.util.List;

/**
 * Entry point for the management of clinical observations
 */
public interface ManageObservationsUseCase {
    
    /**
     * Record a new medical observation for a patient
     */
    ClinicalObservation recordObservation(String patientId, String nutritionistId, String note);
    
    /**
     * It obtains a patient's observation history
     */
    List<ClinicalObservation> getPatientObservations(String patientId);
}