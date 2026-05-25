package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import java.util.List;
import java.util.Optional;

/**
 * Exit port for persistence of clinical observations
 * The implementation of this contract will reside in the infrastructure layer (MongoDB)
 */
public interface ClinicalObservationRepositoryPort {
    
    /**
     * Save a new observation in the repository
     */
    ClinicalObservation save(ClinicalObservation observation);
    
    /**
     * Retrieve all observations for a specific patient
     * The implementation must ensure that observations are returned sorted from newest to oldest
     */
    List<ClinicalObservation> findAllByPatientId(String patientId);

    Optional<ClinicalObservation> findById(String observationId);

    void deleteById(String observationId);

    /**
     * Remove every stored observation for a patient
     */
    void deleteAllByPatientId(String patientId);
}
