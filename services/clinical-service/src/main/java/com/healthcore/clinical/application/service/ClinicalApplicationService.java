package com.healthcore.clinical.application.service;

import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.PostalCodeCatalogEntry;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import com.healthcore.clinical.domain.port.out.PostalCodeCatalogPort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ClinicalApplicationService implements ManageProfileUseCase {

    private final ClinicalRepositoryPort patientRepositoryPort;
    private final NutritionistProfileRepositoryPort nutritionistRepositoryPort;
    private final PostalCodeCatalogPort postalCodeCatalogPort;

    public ClinicalApplicationService(
            ClinicalRepositoryPort patientRepositoryPort,
            NutritionistProfileRepositoryPort nutritionistRepositoryPort,
            PostalCodeCatalogPort postalCodeCatalogPort
    ) {
        this.patientRepositoryPort = patientRepositoryPort;
        this.nutritionistRepositoryPort = nutritionistRepositoryPort;
        this.postalCodeCatalogPort = postalCodeCatalogPort;
    }

    @Override
    public PatientProfile createProfile(PatientProfile profile) {
        return patientRepositoryPort.save(profile);
    }

    @Override
    public PatientProfile updateProfile(String userId, PatientProfile updatedProfile) {
        PatientProfile existingProfile = patientRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));

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

        return patientRepositoryPort.save(existingProfile);
    }

    @Override
    public Optional<PatientProfile> getProfileByUserId(String userId) {
        return patientRepositoryPort.findByUserId(userId);
    }

    @Override
    public List<PatientProfile> getProfilesByNutritionistId(String nutritionistId) {
        return patientRepositoryPort.findAllByNutritionistId(nutritionistId);
    }

    @Override
    public PatientProfile getProfileForNutritionist(String nutritionistId, String patientId) {
        PatientProfile profile = patientRepositoryPort.findByUserId(patientId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + patientId));

        if (profile.getNutritionistId() == null || !profile.getNutritionistId().equals(nutritionistId)) {
            throw new AccessDeniedException("Action denied: Patient is not linked to this nutritionist.");
        }

        return profile;
    }

    @Override
    public HealthGoal updateWeight(String userId, Double weightKg, LocalDate date) {
        PatientProfile profile = patientRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));

        HealthGoal newGoal = profile.registerWeight(weightKg, date);
        patientRepositoryPort.save(profile);
        return newGoal;
    }

    @Override
    public HealthGoal editWeight(String userId, LocalDate originalDate, Double weightKg, LocalDate date) {
        PatientProfile profile = patientRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));

        HealthGoal newGoal = profile.editWeightRecord(originalDate, weightKg, date);
        patientRepositoryPort.save(profile);
        return newGoal;
    }

    @Override
    public HealthGoal deleteWeight(String userId, LocalDate date) {
        PatientProfile profile = patientRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));

        HealthGoal newGoal = profile.deleteWeightRecord(date);
        patientRepositoryPort.save(profile);
        return newGoal;
    }

    @Override
    public List<WeightRecord> getWeightHistory(String userId) {
        return patientRepositoryPort.findByUserId(userId)
                .map(PatientProfile::getWeightHistory)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));
    }

    @Override
    public NutritionistProfile createNutritionistProfile(NutritionistProfile profile) {
        validateClinicAddress(profile.getClinicAddress());
        return nutritionistRepositoryPort.save(profile);
    }

    @Override
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

        validateClinicAddress(existingProfile.getClinicAddress());
        return nutritionistRepositoryPort.save(existingProfile);
    }

    @Override
    public Optional<NutritionistProfile> getNutritionistProfileByUserId(String userId) {
        return nutritionistRepositoryPort.findByUserId(userId);
    }

    private void validateClinicAddress(ClinicAddress clinicAddress) {
        if (clinicAddress == null) {
            return;
        }

        if (!clinicAddress.isComplete()) {
            throw new IllegalArgumentException("Clinic address must be complete when provided.");
        }

        Optional<PostalCodeCatalogEntry> catalogEntry = postalCodeCatalogPort.findByPostalCode(clinicAddress.getPostalCode());
        if (catalogEntry.isPresent() && !catalogEntry.get().matches(clinicAddress)) {
            throw new IllegalArgumentException("Clinic address does not match the postal code catalog.");
        }
    }
}
