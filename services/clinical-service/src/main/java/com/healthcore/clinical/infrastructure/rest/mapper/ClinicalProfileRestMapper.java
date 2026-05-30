package com.healthcore.clinical.infrastructure.rest.mapper;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressReportResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import org.springframework.stereotype.Component;

@Component
public class ClinicalProfileRestMapper {

    private final PatientProfileRestMapper patientProfileRestMapper;
    private final NutritionistProfileRestMapper nutritionistProfileRestMapper;
    private final HealthGoalRestMapper healthGoalRestMapper;
    private final NutritionistWeightProgressRestMapper nutritionistWeightProgressRestMapper;

    public ClinicalProfileRestMapper(
            PatientProfileRestMapper patientProfileRestMapper,
            NutritionistProfileRestMapper nutritionistProfileRestMapper,
            HealthGoalRestMapper healthGoalRestMapper,
            NutritionistWeightProgressRestMapper nutritionistWeightProgressRestMapper
    ) {
        this.patientProfileRestMapper = patientProfileRestMapper;
        this.nutritionistProfileRestMapper = nutritionistProfileRestMapper;
        this.healthGoalRestMapper = healthGoalRestMapper;
        this.nutritionistWeightProgressRestMapper = nutritionistWeightProgressRestMapper;
    }

    public PatientProfile toPatientProfile(String userId, CreateProfileRequest request) {
        return patientProfileRestMapper.toDomain(userId, request);
    }

    public NutritionistProfile toNutritionistProfile(String userId, UpsertNutritionistProfileRequest request) {
        return nutritionistProfileRestMapper.toDomain(userId, request);
    }

    public PatientProfileResponse toPatientProfileResponse(PatientProfile profile, String profilePhotoUrl) {
        return patientProfileRestMapper.toResponse(profile, profilePhotoUrl);
    }

    public NutritionistProfileResponse toNutritionistProfileResponse(
            NutritionistProfile profile,
            String profilePhotoUrl
    ) {
        return nutritionistProfileRestMapper.toResponse(profile, profilePhotoUrl);
    }

    public HealthGoalResponse toHealthGoalResponse(HealthGoal goal) {
        return healthGoalRestMapper.toResponse(goal);
    }

    public NutritionistWeightProgressReportResponse toNutritionistWeightProgressReportResponse(
            NutritionistWeightProgressReport report
    ) {
        return nutritionistWeightProgressRestMapper.toResponse(report);
    }
}
