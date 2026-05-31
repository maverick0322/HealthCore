package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.ClinicAddressCatalogValidator;
import com.healthcore.clinical.application.service.support.ProfilePhotoKeyValidator;
import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class NutritionistProfileApplicationService {

    private final NutritionistProfileRepositoryPort nutritionistRepositoryPort;
    private final ClinicAddressCatalogValidator clinicAddressCatalogValidator;
    private final ProfilePhotoKeyValidator profilePhotoKeyValidator;

    public NutritionistProfileApplicationService(
            NutritionistProfileRepositoryPort nutritionistRepositoryPort,
            ClinicAddressCatalogValidator clinicAddressCatalogValidator,
            ProfilePhotoKeyValidator profilePhotoKeyValidator
    ) {
        this.nutritionistRepositoryPort = nutritionistRepositoryPort;
        this.clinicAddressCatalogValidator = clinicAddressCatalogValidator;
        this.profilePhotoKeyValidator = profilePhotoKeyValidator;
    }

    public NutritionistProfile createNutritionistProfile(NutritionistProfile profile) {
        clinicAddressCatalogValidator.validate(profile.getClinicAddress());
        return nutritionistRepositoryPort.save(profile);
    }

    public NutritionistProfile updateNutritionistProfile(String userId, NutritionistProfile profile) {
        NutritionistProfile existingProfile = nutritionistRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Nutritionist profile not found for user: " + userId));

        existingProfile.updateProfile(
                profile.getFirstName(),
                profile.getPaternalLastName(),
                profile.getMaternalLastName(),
                profile.getSpecializations(),
                profile.getCustomSpecialization(),
                profile.getProfessionalLicense(),
                profile.getConsultationTypes(),
                profile.getPhone(),
                profile.getClinicAddress(),
                profile.getBio()
        );

        clinicAddressCatalogValidator.validate(existingProfile.getClinicAddress());
        return nutritionistRepositoryPort.save(existingProfile);
    }

    public NutritionistProfile updateNutritionistProfilePhoto(String userId, String profilePhotoKey) {
        NutritionistProfile profile = nutritionistRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Nutritionist profile not found for user: " + userId));

        profile.updateProfilePhoto(profilePhotoKeyValidator.validateOwnership(userId, profilePhotoKey));
        return nutritionistRepositoryPort.save(profile);
    }

    public Optional<NutritionistProfile> getNutritionistProfileByUserId(String userId) {
        return nutritionistRepositoryPort.findByUserId(userId);
    }
}
