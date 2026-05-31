package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.ProfilePhotoKeyValidator;
import com.healthcore.clinical.domain.model.PatientProfile;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientProfileApplicationService {

    private final PatientProfileAccessService patientProfileAccessService;
    private final ProfilePhotoKeyValidator profilePhotoKeyValidator;

    public PatientProfileApplicationService(
            PatientProfileAccessService patientProfileAccessService,
            ProfilePhotoKeyValidator profilePhotoKeyValidator
    ) {
        this.patientProfileAccessService = patientProfileAccessService;
        this.profilePhotoKeyValidator = profilePhotoKeyValidator;
    }

    public PatientProfile createProfile(PatientProfile profile) {
        return patientProfileAccessService.save(profile);
    }

    public PatientProfile updateProfile(String userId, PatientProfile updatedProfile) {
        PatientProfile existingProfile = patientProfileAccessService.requireByUserId(userId);

        existingProfile.updateProfile(
                updatedProfile.getFirstName(),
                updatedProfile.getPaternalLastName(),
                updatedProfile.getMaternalLastName(),
                updatedProfile.getWeightKg(),
                updatedProfile.getHeightCm(),
                updatedProfile.getBirthDate(),
                updatedProfile.getGender(),
                updatedProfile.getActivityLevel(),
                updatedProfile.getGoal(),
                updatedProfile.getDietType(),
                updatedProfile.getAllergies(),
                updatedProfile.getExcludedFoods()
        );

        return patientProfileAccessService.save(existingProfile);
    }

    public Optional<PatientProfile> getProfileByUserId(String userId) {
        return patientProfileAccessService.findByUserId(userId);
    }

    public List<PatientProfile> getProfilesByNutritionistId(String nutritionistId) {
        return patientProfileAccessService.findAllByNutritionistId(nutritionistId);
    }

    public PatientProfile getProfileForNutritionist(String nutritionistId, String patientId) {
        return patientProfileAccessService.requireForNutritionist(nutritionistId, patientId);
    }

    public PatientProfile updatePatientMetricsForNutritionist(
            String nutritionistId,
            String patientId,
            Double weightKg,
            Double heightCm
    ) {
        PatientProfile profile = patientProfileAccessService.requireForNutritionist(nutritionistId, patientId);

        profile.updateProfile(
                profile.getFirstName(),
                profile.getPaternalLastName(),
                profile.getMaternalLastName(),
                weightKg,
                heightCm,
                profile.getBirthDate(),
                profile.getGender(),
                profile.getActivityLevel(),
                profile.getGoal(),
                profile.getDietType(),
                profile.getAllergies(),
                profile.getExcludedFoods()
        );

        return patientProfileAccessService.save(profile);
    }

    public PatientProfile updateProfilePhoto(String userId, String profilePhotoKey) {
        PatientProfile profile = patientProfileAccessService.requireByUserId(userId);

        profile.updateProfilePhoto(profilePhotoKeyValidator.validateOwnership(userId, profilePhotoKey));
        return patientProfileAccessService.save(profile);
    }
}
