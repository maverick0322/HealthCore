package com.healthcore.clinical.infrastructure.rest.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;

@Component
public class PatientProfileRestMapper {

    public PatientProfile toDomain(String userId, CreateProfileRequest request) {
        return new PatientProfile(
                userId,
                request.firstName(),
                request.paternalLastName(),
                request.maternalLastName(),
                request.weightKg(),
                request.heightCm(),
                request.birthDate(),
                Gender.valueOf(request.gender().toUpperCase()),
                ActivityLevel.valueOf(request.activityLevel().toUpperCase()),
                request.goal(),
                request.dietType(),
                request.allergies(),
                request.excludedFoods()
        );
    }

    public PatientProfileResponse toResponse(PatientProfile profile, String profilePhotoUrl) {
        return new PatientProfileResponse(
                profile.getUserId(),
                profile.getFirstName(),
                profile.getPaternalLastName(),
                profile.getMaternalLastName(),
                profile.getFullName(),
                profile.getWeightKg(),
                profile.getHeightCm(),
                profile.getBirthDate(),
                profile.getGender() != null ? profile.getGender().name() : null,
                profile.getActivityLevel() != null ? profile.getActivityLevel().name() : null,
                profile.getGoal(),
                profile.getDietType(),
                profile.getAllergies() != null ? profile.getAllergies() : List.of(),
                profile.getExcludedFoods() != null ? profile.getExcludedFoods() : List.of(),
                profile.getNutritionistId(),
                profilePhotoUrl,
                profile.isProfileCompleted()
        );
    }
}
