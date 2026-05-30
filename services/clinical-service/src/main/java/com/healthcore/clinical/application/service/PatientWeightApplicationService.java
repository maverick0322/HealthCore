package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class PatientWeightApplicationService {

    private final PatientProfileAccessService patientProfileAccessService;

    public PatientWeightApplicationService(PatientProfileAccessService patientProfileAccessService) {
        this.patientProfileAccessService = patientProfileAccessService;
    }

    public HealthGoal updateWeight(String userId, Double weightKg, LocalDate date) {
        PatientProfile profile = patientProfileAccessService.requireByUserId(userId);

        HealthGoal newGoal = profile.registerWeight(weightKg, date);
        patientProfileAccessService.save(profile);
        return newGoal;
    }

    public HealthGoal editWeight(String userId, LocalDate originalDate, Double weightKg, LocalDate date) {
        PatientProfile profile = patientProfileAccessService.requireByUserId(userId);

        HealthGoal newGoal = profile.editWeightRecord(originalDate, weightKg, date);
        patientProfileAccessService.save(profile);
        return newGoal;
    }

    public HealthGoal deleteWeight(String userId, LocalDate date) {
        PatientProfile profile = patientProfileAccessService.requireByUserId(userId);

        HealthGoal newGoal = profile.deleteWeightRecord(date);
        patientProfileAccessService.save(profile);
        return newGoal;
    }

    public List<WeightRecord> getWeightHistory(String userId) {
        return patientProfileAccessService.requireByUserId(userId).getWeightHistory();
    }

    public List<WeightRecord> getWeightHistoryForNutritionist(String nutritionistId, String patientId) {
        return patientProfileAccessService.requireForNutritionist(nutritionistId, patientId).getWeightHistory();
    }
}
