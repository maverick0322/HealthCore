package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.WeightRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ManageProfileUseCase {
    PatientProfile createProfile(PatientProfile profile);
    PatientProfile updateProfile(String userId, PatientProfile profile);
    Optional<PatientProfile> getProfileByUserId(String userId);
    List<PatientProfile> getProfilesByNutritionistId(String nutritionistId);
    PatientProfile getProfileForNutritionist(String nutritionistId, String patientId);
    PatientProfile updatePatientMetricsForNutritionist(String nutritionistId, String patientId, Double weightKg, Double heightCm);
    NutritionistWeightProgressReport getNutritionistWeightProgressReport(
            String nutritionistId,
            LocalDate from,
            LocalDate to
    );
    HealthGoal updateWeight(String userId, Double weightKg, LocalDate date);
    HealthGoal editWeight(String userId, LocalDate originalDate, Double weightKg, LocalDate date);
    HealthGoal deleteWeight(String userId, LocalDate date);
    List<WeightRecord> getWeightHistory(String userId);
    List<WeightRecord> getWeightHistoryForNutritionist(String nutritionistId, String patientId);
    NutritionistProfile createNutritionistProfile(NutritionistProfile profile);
    NutritionistProfile updateNutritionistProfile(String userId, NutritionistProfile profile);
    Optional<NutritionistProfile> getNutritionistProfileByUserId(String userId);
}
