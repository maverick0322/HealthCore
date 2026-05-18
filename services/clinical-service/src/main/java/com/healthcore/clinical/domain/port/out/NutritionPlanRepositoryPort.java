package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.NutritionPlan;

import java.util.List;
import java.util.Optional;

public interface NutritionPlanRepositoryPort {
    NutritionPlan save(NutritionPlan nutritionPlan);
    Optional<NutritionPlan> findActiveByPatientIdAndAuthorType(String patientId, AuthorType authorType);
    Optional<NutritionPlan> findActiveByPatientIdAndAuthorTypeAndAuthorId(String patientId, AuthorType authorType, String authorId);
    Optional<NutritionPlan> findLatestByPatientIdAndAuthorType(String patientId, AuthorType authorType);
    List<NutritionPlan> findActiveByPatientId(String patientId);
}
