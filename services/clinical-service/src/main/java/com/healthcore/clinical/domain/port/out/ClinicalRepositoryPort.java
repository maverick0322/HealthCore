package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.PatientProfile;

import java.util.List;
import java.util.Optional;

public interface ClinicalRepositoryPort {
    PatientProfile save(PatientProfile profile);
    Optional<PatientProfile> findByUserId(String userId);
    List<PatientProfile> findAllByNutritionistId(String nutritionistId);
}
