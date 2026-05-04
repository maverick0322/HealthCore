package com.healthcore.clinical.domain.port.in;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;

import java.util.List;
import java.util.Optional;

public interface ManageProfileUseCase {
    PatientProfile createProfile(PatientProfile profile);
    Optional<PatientProfile> getProfileByUserId(String userId);
    HealthGoal updateWeight(String userId, Double weightKg);
    List<WeightRecord> getWeightHistory(String userId);
}