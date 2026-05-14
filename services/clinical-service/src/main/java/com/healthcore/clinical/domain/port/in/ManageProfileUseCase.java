package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;

import java.util.List;
import java.util.Optional;

public interface ManageProfileUseCase {
    PatientProfile createProfile(PatientProfile profile);
    PatientProfile updateProfile(String userId, PatientProfile profile);
    Optional<PatientProfile> getProfileByUserId(String userId);
    List<PatientProfile> getProfilesByNutritionistId(String nutritionistId);
    PatientProfile getProfileForNutritionist(String nutritionistId, String patientId);
    HealthGoal updateWeight(String userId, Double weightKg);
    List<WeightRecord> getWeightHistory(String userId);
    NutritionistProfile createNutritionistProfile(NutritionistProfile profile);
    NutritionistProfile updateNutritionistProfile(String userId, NutritionistProfile profile);
    Optional<NutritionistProfile> getNutritionistProfileByUserId(String userId);
}
