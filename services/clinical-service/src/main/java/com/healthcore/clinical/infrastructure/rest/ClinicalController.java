package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressResponse;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/clinical")
public class ClinicalController {

    private static final Logger logger = LoggerFactory.getLogger(ClinicalController.class);

    private final ManageProfileUseCase manageProfileUseCase;

    public ClinicalController(ManageProfileUseCase manageProfileUseCase) {
        this.manageProfileUseCase = manageProfileUseCase;
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> createProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateProfileRequest request
    ) {
        logger.info("[ClinicalController] Creating patient profile for userId={}", userId);
        manageProfileUseCase.createProfile(toPatientProfile(userId, request));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponse> updateMyProfile(@Valid @RequestBody CreateProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating patient profile for userId={}", userId);
        PatientProfile updatedProfile = manageProfileUseCase.updateProfile(userId, toPatientProfile(userId, request));
        return ResponseEntity.ok(toPatientProfileResponse(updatedProfile));
    }

    @GetMapping("/goals/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthGoalResponse> getMyGoals(@RequestHeader("X-User-Id") String userId) {
        logger.info("[ClinicalController] Getting goals for userId={}", userId);
        Optional<PatientProfile> profileOpt = manageProfileUseCase.getProfileByUserId(userId);

        if (profileOpt.isEmpty()) {
            logger.warn("[ClinicalController] No profile found for userId={}", userId);
            return ResponseEntity.notFound().build();
        }

        HealthGoal goal = profileOpt.get().generateHealthGoals();
        HealthGoalResponse response = new HealthGoalResponse(
                goal.targetCalories(),
                goal.targetProtein(),
                goal.targetCarbs(),
                goal.targetFat()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/weight")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthGoalResponse> updateWeight(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        logger.info("[ClinicalController] Updating weight for userId={} weightKg={}", userId, request.weightKg());
        HealthGoal newGoal = manageProfileUseCase.updateWeight(userId, request.weightKg());
        HealthGoalResponse response = new HealthGoalResponse(
                newGoal.targetCalories(),
                newGoal.targetProtein(),
                newGoal.targetCarbs(),
                newGoal.targetFat()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/weight/history")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<WeightRecord>> getWeightHistory(@RequestHeader("X-User-Id") String userId) {
        logger.info("[ClinicalController] Getting weight history for userId={}", userId);
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistory(userId));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponse> getMyProfile() {
        String patientId = getCurrentUserId();
        logger.info("[ClinicalController] Getting profile for patientId={}", patientId);
        return manageProfileUseCase.getProfileByUserId(patientId)
                .map(profile -> ResponseEntity.ok(toPatientProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/nutritionist/profile")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<Void> createNutritionistProfile(@Valid @RequestBody UpsertNutritionistProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Creating nutritionist profile for userId={}", userId);
        manageProfileUseCase.createNutritionistProfile(toNutritionistProfile(userId, request));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/nutritionist/profile/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<NutritionistProfileResponse> updateMyNutritionistProfile(
            @Valid @RequestBody UpsertNutritionistProfileRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating nutritionist profile for userId={}", userId);
        NutritionistProfile updatedProfile = manageProfileUseCase.updateNutritionistProfile(
                userId,
                toNutritionistProfile(userId, request)
        );
        return ResponseEntity.ok(toNutritionistProfileResponse(updatedProfile));
    }

    @GetMapping("/nutritionist/profile/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<NutritionistProfileResponse> getMyNutritionistProfile() {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Getting nutritionist profile for userId={}", userId);
        return manageProfileUseCase.getNutritionistProfileByUserId(userId)
                .map(profile -> ResponseEntity.ok(toNutritionistProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/nutritionist/patients")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<List<PatientProfileResponse>> getNutritionistPatients() {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting linked patients for nutritionistId={}", nutritionistId);
        List<PatientProfileResponse> patients = manageProfileUseCase.getProfilesByNutritionistId(nutritionistId)
                .stream()
                .map(this::toPatientProfileResponse)
                .toList();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/nutritionist/patients/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<PatientProfileResponse> getNutritionistPatientProfile(@PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting patient profile for nutritionistId={} patientId={}",
                nutritionistId, patientId);
        PatientProfile profile = manageProfileUseCase.getProfileForNutritionist(nutritionistId, patientId);
        return ResponseEntity.ok(toPatientProfileResponse(profile));
    }

    private PatientProfile toPatientProfile(String userId, CreateProfileRequest request) {
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

    private NutritionistProfile toNutritionistProfile(String userId, UpsertNutritionistProfileRequest request) {
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
                request.bio()
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
                request.neighborhood(),
                request.street(),
                request.exteriorNumber(),
                request.interiorNumber()
        );
    }

    private PatientProfileResponse toPatientProfileResponse(PatientProfile profile) {
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
                profile.isProfileCompleted()
        );
    }

    private NutritionistProfileResponse toNutritionistProfileResponse(NutritionistProfile profile) {
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
                profile.isProfileCompleted()
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
                address.getNeighborhood(),
                address.getStreet(),
                address.getExteriorNumber(),
                address.getInteriorNumber()
        );
    }

    private String getCurrentUserId() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }
}
