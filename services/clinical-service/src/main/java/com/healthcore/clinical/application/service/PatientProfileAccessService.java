package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientProfileAccessService {

    private final ClinicalRepositoryPort patientRepositoryPort;

    public PatientProfileAccessService(ClinicalRepositoryPort patientRepositoryPort) {
        this.patientRepositoryPort = patientRepositoryPort;
    }

    public PatientProfile requireByUserId(String userId) {
        return patientRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));
    }

    public Optional<PatientProfile> findByUserId(String userId) {
        return patientRepositoryPort.findByUserId(userId);
    }

    public List<PatientProfile> findAllByNutritionistId(String nutritionistId) {
        return patientRepositoryPort.findAllByNutritionistId(nutritionistId);
    }

    public PatientProfile requireForNutritionist(String nutritionistId, String patientId) {
        PatientProfile profile = requireByUserId(patientId);

        if (profile.getNutritionistId() == null || !profile.getNutritionistId().equals(nutritionistId)) {
            throw new AccessDeniedException("Action denied: Patient is not linked to this nutritionist.");
        }

        return profile;
    }

    public PatientProfile save(PatientProfile profile) {
        return patientRepositoryPort.save(profile);
    }
}
