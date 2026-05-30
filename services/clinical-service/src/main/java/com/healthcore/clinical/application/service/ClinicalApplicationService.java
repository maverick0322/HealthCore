package com.healthcore.clinical.application.service;

import com.healthcore.clinical.application.service.support.ClinicAddressCatalogValidator;
import com.healthcore.clinical.application.service.support.NutritionistWeightProgressReportFactory;
import com.healthcore.clinical.application.service.support.ProfilePhotoKeyValidator;
import com.healthcore.clinical.domain.exception.ProfileNotFoundException;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ClinicalApplicationService implements ManageProfileUseCase {

    private final ClinicalRepositoryPort patientRepositoryPort;
    private final NutritionistProfileRepositoryPort nutritionistRepositoryPort;
    private final ClinicAddressCatalogValidator clinicAddressCatalogValidator;
    private final ProfilePhotoKeyValidator profilePhotoKeyValidator;
    private final NutritionistWeightProgressReportFactory nutritionistWeightProgressReportFactory;

    public ClinicalApplicationService(
            ClinicalRepositoryPort patientRepositoryPort,
            NutritionistProfileRepositoryPort nutritionistRepositoryPort,
            ClinicAddressCatalogValidator clinicAddressCatalogValidator,
            ProfilePhotoKeyValidator profilePhotoKeyValidator,
            NutritionistWeightProgressReportFactory nutritionistWeightProgressReportFactory
    ) {
        this.patientRepositoryPort = patientRepositoryPort;
        this.nutritionistRepositoryPort = nutritionistRepositoryPort;
        this.clinicAddressCatalogValidator = clinicAddressCatalogValidator;
        this.profilePhotoKeyValidator = profilePhotoKeyValidator;
        this.nutritionistWeightProgressReportFactory = nutritionistWeightProgressReportFactory;
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
    public PatientProfile updatePatientMetricsForNutritionist(
            String nutritionistId,
            String patientId,
            Double weightKg,
            Double heightCm
    ) {
        PatientProfile profile = getProfileForNutritionist(nutritionistId, patientId);

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

        return patientRepositoryPort.save(profile);
    }

    @Override
    public PatientProfile updateProfilePhoto(String userId, String profilePhotoKey) {
        PatientProfile profile = patientRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Profile not found for user: " + userId));

        profile.updateProfilePhoto(profilePhotoKeyValidator.validateOwnership(userId, profilePhotoKey));
        return patientRepositoryPort.save(profile);
    }

    @Override
    public NutritionistWeightProgressReport getNutritionistWeightProgressReport(
            String nutritionistId,
            LocalDate from,
            LocalDate to
    ) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new IllegalArgumentException("Invalid report range.");
        }

        return nutritionistWeightProgressReportFactory.create(
                patientRepositoryPort.findAllByNutritionistId(nutritionistId),
                from,
                to
        );
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
    public List<WeightRecord> getWeightHistoryForNutritionist(String nutritionistId, String patientId) {
        return getProfileForNutritionist(nutritionistId, patientId).getWeightHistory();
    }

    @Override
    public NutritionistProfile createNutritionistProfile(NutritionistProfile profile) {
        clinicAddressCatalogValidator.validate(profile.getClinicAddress());
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

        clinicAddressCatalogValidator.validate(existingProfile.getClinicAddress());
        return nutritionistRepositoryPort.save(existingProfile);
    }

    @Override
    public NutritionistProfile updateNutritionistProfilePhoto(String userId, String profilePhotoKey) {
        NutritionistProfile profile = nutritionistRepositoryPort.findByUserId(userId)
                .orElseThrow(() -> new ProfileNotFoundException("Nutritionist profile not found for user: " + userId));

        profile.updateProfilePhoto(profilePhotoKeyValidator.validateOwnership(userId, profilePhotoKey));
        return nutritionistRepositoryPort.save(profile);
    }

    @Override
    public Optional<NutritionistProfile> getNutritionistProfileByUserId(String userId) {
        return nutritionistRepositoryPort.findByUserId(userId);
    }
}
