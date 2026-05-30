package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ClinicalApplicationService implements ManageProfileUseCase {

    private final PatientProfileApplicationService patientProfileApplicationService;
    private final PatientWeightApplicationService patientWeightApplicationService;
    private final NutritionistProfileApplicationService nutritionistProfileApplicationService;
    private final NutritionistWeightProgressApplicationService nutritionistWeightProgressApplicationService;

    public ClinicalApplicationService(
            PatientProfileApplicationService patientProfileApplicationService,
            PatientWeightApplicationService patientWeightApplicationService,
            NutritionistProfileApplicationService nutritionistProfileApplicationService,
            NutritionistWeightProgressApplicationService nutritionistWeightProgressApplicationService
    ) {
        this.patientProfileApplicationService = patientProfileApplicationService;
        this.patientWeightApplicationService = patientWeightApplicationService;
        this.nutritionistProfileApplicationService = nutritionistProfileApplicationService;
        this.nutritionistWeightProgressApplicationService = nutritionistWeightProgressApplicationService;
    }

    @Override
    public PatientProfile createProfile(PatientProfile profile) {
        return patientProfileApplicationService.createProfile(profile);
    }

    @Override
    public PatientProfile updateProfile(String userId, PatientProfile updatedProfile) {
        return patientProfileApplicationService.updateProfile(userId, updatedProfile);
    }

    @Override
    public Optional<PatientProfile> getProfileByUserId(String userId) {
        return patientProfileApplicationService.getProfileByUserId(userId);
    }

    @Override
    public List<PatientProfile> getProfilesByNutritionistId(String nutritionistId) {
        return patientProfileApplicationService.getProfilesByNutritionistId(nutritionistId);
    }

    @Override
    public PatientProfile getProfileForNutritionist(String nutritionistId, String patientId) {
        return patientProfileApplicationService.getProfileForNutritionist(nutritionistId, patientId);
    }

    @Override
    public PatientProfile updatePatientMetricsForNutritionist(
            String nutritionistId,
            String patientId,
            Double weightKg,
            Double heightCm
    ) {
        return patientProfileApplicationService.updatePatientMetricsForNutritionist(
                nutritionistId,
                patientId,
                weightKg,
                heightCm
        );
    }

    @Override
    public PatientProfile updateProfilePhoto(String userId, String profilePhotoKey) {
        return patientProfileApplicationService.updateProfilePhoto(userId, profilePhotoKey);
    }

    @Override
    public NutritionistWeightProgressReport getNutritionistWeightProgressReport(
            String nutritionistId,
            LocalDate from,
            LocalDate to
    ) {
        return nutritionistWeightProgressApplicationService.getNutritionistWeightProgressReport(
                nutritionistId,
                from,
                to
        );
    }

    @Override
    public HealthGoal updateWeight(String userId, Double weightKg, LocalDate date) {
        return patientWeightApplicationService.updateWeight(userId, weightKg, date);
    }

    @Override
    public HealthGoal editWeight(String userId, LocalDate originalDate, Double weightKg, LocalDate date) {
        return patientWeightApplicationService.editWeight(userId, originalDate, weightKg, date);
    }

    @Override
    public HealthGoal deleteWeight(String userId, LocalDate date) {
        return patientWeightApplicationService.deleteWeight(userId, date);
    }

    @Override
    public List<WeightRecord> getWeightHistory(String userId) {
        return patientWeightApplicationService.getWeightHistory(userId);
    }

    @Override
    public List<WeightRecord> getWeightHistoryForNutritionist(String nutritionistId, String patientId) {
        return patientWeightApplicationService.getWeightHistoryForNutritionist(nutritionistId, patientId);
    }

    @Override
    public NutritionistProfile createNutritionistProfile(NutritionistProfile profile) {
        return nutritionistProfileApplicationService.createNutritionistProfile(profile);
    }

    @Override
    public NutritionistProfile updateNutritionistProfile(String userId, NutritionistProfile profile) {
        return nutritionistProfileApplicationService.updateNutritionistProfile(userId, profile);
    }

    @Override
    public NutritionistProfile updateNutritionistProfilePhoto(String userId, String profilePhotoKey) {
        return nutritionistProfileApplicationService.updateNutritionistProfilePhoto(userId, profilePhotoKey);
    }

    @Override
    public Optional<NutritionistProfile> getNutritionistProfileByUserId(String userId) {
        return nutritionistProfileApplicationService.getNutritionistProfileByUserId(userId);
    }
}
