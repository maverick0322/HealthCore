package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.DailyGoalsSnapshot;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class NutritionPlanProfileContextService {

    private static final Logger logger = LoggerFactory.getLogger(NutritionPlanProfileContextService.class);

    private final ClinicalRepositoryPort clinicalRepositoryPort;

    public NutritionPlanProfileContextService(ClinicalRepositoryPort clinicalRepositoryPort) {
        this.clinicalRepositoryPort = clinicalRepositoryPort;
    }

    public PatientProfile getRequiredProfile(String patientId) {
        logger.debug("[NutritionPlanProfileContextService] Looking up patient profile patientId={}", patientId);
        return clinicalRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Patient clinical profile not found."));
    }

    public PatientProfile getProfileForNutritionist(String nutritionistId, String patientId) {
        PatientProfile profile = getRequiredProfile(patientId);
        if (!nutritionistId.equals(profile.getNutritionistId())) {
            logger.warn("[NutritionPlanProfileContextService] Nutritionist access denied nutritionistId={} patientId={} linkedNutritionistId={}",
                    nutritionistId, patientId, profile.getNutritionistId());
            throw new AccessDeniedException("Action denied: Patient is not linked to this nutritionist.");
        }
        return profile;
    }

    public DailyGoalsSnapshot buildDailyGoals(PatientProfile profile) {
        HealthGoal healthGoal = profile.generateHealthGoals();
        return DailyGoalsSnapshot.fromHealthGoal(healthGoal);
    }

    public boolean isLinked(PatientProfile profile) {
        return profile.getNutritionistId() != null && !profile.getNutritionistId().isBlank();
    }
}
