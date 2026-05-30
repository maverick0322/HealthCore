package com.healthcore.clinical.infrastructure.rest.mapper;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressResponse;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressReportResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressRowResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ClinicalProfileRestMapper {

    public PatientProfile toPatientProfile(String userId, CreateProfileRequest request) {
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

    public NutritionistProfile toNutritionistProfile(String userId, UpsertNutritionistProfileRequest request) {
        return new NutritionistProfile(
                userId,
                request.firstName(),
                request.paternalLastName(),
                request.maternalLastName(),
                request.specializations(),
                request.customSpecialization(),
                request.professionalLicense(),
                request.consultationTypes(),
                request.phone(),
                toClinicAddress(request.clinicAddress()),
                request.bio(),
                null
        );
    }

    public PatientProfileResponse toPatientProfileResponse(PatientProfile profile, String profilePhotoUrl) {
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

    public NutritionistProfileResponse toNutritionistProfileResponse(
            NutritionistProfile profile,
            String profilePhotoUrl
    ) {
        return new NutritionistProfileResponse(
                profile.getUserId(),
                profile.getFirstName(),
                profile.getPaternalLastName(),
                profile.getMaternalLastName(),
                profile.getFullName(),
                profile.getSpecializations() != null ? profile.getSpecializations() : List.of(),
                profile.getCustomSpecialization(),
                profile.getProfessionalLicense(),
                profile.getConsultationTypes() != null ? profile.getConsultationTypes() : List.of(),
                profile.getPhone(),
                toClinicAddressResponse(profile.getClinicAddress()),
                profile.getBio(),
                profilePhotoUrl,
                profile.isProfileCompleted()
        );
    }

    public HealthGoalResponse toHealthGoalResponse(HealthGoal goal) {
        return new HealthGoalResponse(
                goal.targetCalories(),
                goal.targetProtein(),
                goal.targetCarbs(),
                goal.targetFat(),
                goal.targetWaterGlasses()
        );
    }

    public NutritionistWeightProgressReportResponse toNutritionistWeightProgressReportResponse(
            NutritionistWeightProgressReport report
    ) {
        return new NutritionistWeightProgressReportResponse(
                report.activePatients(),
                report.patientsWithoutWeightInRange(),
                report.rows().stream()
                        .map(this::toNutritionistWeightProgressRowResponse)
                        .toList()
        );
    }

    private NutritionistWeightProgressRowResponse toNutritionistWeightProgressRowResponse(
            NutritionistWeightProgressRow row
    ) {
        return new NutritionistWeightProgressRowResponse(
                row.patientId(),
                row.fullName(),
                row.latestRecordDateInRange(),
                row.startWeightKg(),
                row.currentWeightKg(),
                row.netChangeKg(),
                row.hasRecordsInRange()
        );
    }

    private ClinicAddress toClinicAddress(ClinicAddressRequest request) {
        if (request == null) {
            return null;
        }
        return ClinicAddress.rehydrate(
                request.postalCode(),
                request.state(),
                request.city(),
                request.municipality(),
                request.neighborhood(),
                request.street(),
                request.exteriorNumber(),
                request.interiorNumber()
        );
    }

    private ClinicAddressResponse toClinicAddressResponse(ClinicAddress address) {
        if (address == null) {
            return null;
        }
        return new ClinicAddressResponse(
                address.getPostalCode(),
                address.getState(),
                address.getCity(),
                address.getMunicipality(),
                address.getNeighborhood(),
                address.getStreet(),
                address.getExteriorNumber(),
                address.getInteriorNumber()
        );
    }
}
