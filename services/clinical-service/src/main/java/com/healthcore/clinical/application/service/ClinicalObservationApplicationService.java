package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.in.ManageObservationsUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalObservationRepositoryPort;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClinicalObservationApplicationService implements ManageObservationsUseCase {
    private static final int MAX_NOTE_LENGTH = 500;

    private final ClinicalObservationRepositoryPort observationRepositoryPort;
    private final ClinicalRepositoryPort clinicalRepositoryPort;

    public ClinicalObservationApplicationService(
            ClinicalObservationRepositoryPort observationRepositoryPort,
            ClinicalRepositoryPort clinicalRepositoryPort) {
        this.observationRepositoryPort = observationRepositoryPort;
        this.clinicalRepositoryPort = clinicalRepositoryPort;
    }

    @Override
    public ClinicalObservation recordObservation(String patientId, String nutritionistId, String note) {
        validateNote(note);

        PatientProfile profile = getLinkedPatientProfile(patientId, nutritionistId);

        ClinicalObservation observation = new ClinicalObservation(
                null, 
                profile.getUserId(),
                nutritionistId,
                note,
                LocalDateTime.now()
        );

        return observationRepositoryPort.save(observation);
    }

    @Override
    public ClinicalObservation updateObservation(String observationId, String nutritionistId, String note) {
        validateNote(note);

        ClinicalObservation observation = getOwnedObservation(observationId, nutritionistId);
        observation.setNote(note.trim());
        return observationRepositoryPort.save(observation);
    }

    @Override
    public void deleteObservation(String observationId, String nutritionistId) {
        getOwnedObservation(observationId, nutritionistId);
        observationRepositoryPort.deleteById(observationId);
    }

    @Override
    public List<ClinicalObservation> getPatientObservations(String patientId) {
        return observationRepositoryPort.findAllByPatientId(patientId);
    }

    @Override
    public List<ClinicalObservation> getPatientObservations(String patientId, String nutritionistId) {
        PatientProfile profile = getLinkedPatientProfile(patientId, nutritionistId);
        return observationRepositoryPort.findAllByPatientId(profile.getUserId());
    }

    private PatientProfile getLinkedPatientProfile(String patientId, String nutritionistId) {
        PatientProfile profile = clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Cannot add observation. Patient clinical profile not found."));

        if (profile.getNutritionistId() == null || !profile.getNutritionistId().equals(nutritionistId)) {
            throw new AccessDeniedException("Action denied: Patient is not linked to this nutritionist.");
        }

        return profile;
    }

    private ClinicalObservation getOwnedObservation(String observationId, String nutritionistId) {
        ClinicalObservation observation = observationRepositoryPort.findById(observationId)
                .orElseThrow(() -> new ProfileNotFoundException("Observation not found."));

        if (!nutritionistId.equals(observation.getNutritionistId())) {
            throw new AccessDeniedException("Action denied: Observation does not belong to this nutritionist.");
        }

        getLinkedPatientProfile(observation.getPatientId(), nutritionistId);
        return observation;
    }

    private void validateNote(String note) {
        if (note == null || note.trim().isEmpty()) {
            throw new IllegalArgumentException("Observation note cannot be empty.");
        }
        if (note.trim().length() > MAX_NOTE_LENGTH) {
            throw new IllegalArgumentException("Observation note must be at most 500 characters long.");
        }
    }
}
