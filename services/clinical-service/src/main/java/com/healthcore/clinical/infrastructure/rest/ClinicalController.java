package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressRow;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressResponse;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressReportResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressRowResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
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
            @Valid @RequestBody CreateProfileRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Creating patient profile for userHash={}", logHash(userId));
        manageProfileUseCase.createProfile(toPatientProfile(userId, request));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponse> updateMyProfile(@Valid @RequestBody CreateProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating patient profile for userHash={}", logHash(userId));
        PatientProfile updatedProfile = manageProfileUseCase.updateProfile(userId, toPatientProfile(userId, request));
        return ResponseEntity.ok(toPatientProfileResponse(updatedProfile));
    }

    @GetMapping("/goals/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthGoalResponse> getMyGoals(@RequestHeader("X-User-Id") String userId) {
        logger.info("[ClinicalController] Getting goals for userHash={}", logHash(userId));
        Optional<PatientProfile> profileOpt = manageProfileUseCase.getProfileByUserId(userId);

        if (profileOpt.isEmpty()) {
            logger.warn("[ClinicalController] No profile found for userHash={}", logHash(userId));
            return ResponseEntity.notFound().build();
        }

        HealthGoal goal = profileOpt.get().generateHealthGoals();
        HealthGoalResponse response = new HealthGoalResponse(
                goal.targetCalories(),
                goal.targetProtein(),
                goal.targetCarbs(),
                goal.targetFat(),
                goal.targetWaterGlasses()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/weight")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthGoalResponse> updateWeight(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        logger.info("[ClinicalController] Updating weight for userHash={} weightKg={} date={}",
                logHash(userId), request.weightKg(), request.date());
        HealthGoal newGoal = manageProfileUseCase.updateWeight(userId, request.weightKg(), request.date());
        return ResponseEntity.ok(toHealthGoalResponse(newGoal));
    }

    @PutMapping("/weight/{originalDate}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthGoalResponse> editWeight(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate originalDate,
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        logger.info("[ClinicalController] Editing weight for userHash={} originalDate={} weightKg={} date={}",
                logHash(userId), originalDate, request.weightKg(), request.date());
        HealthGoal newGoal = manageProfileUseCase.editWeight(userId, originalDate, request.weightKg(), request.date());
        return ResponseEntity.ok(toHealthGoalResponse(newGoal));
    }

    @DeleteMapping("/weight/{date}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthGoalResponse> deleteWeight(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        logger.info("[ClinicalController] Deleting weight for userHash={} date={}", logHash(userId), date);
        HealthGoal newGoal = manageProfileUseCase.deleteWeight(userId, date);
        return ResponseEntity.ok(toHealthGoalResponse(newGoal));
    }

    @GetMapping("/weight/history")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<WeightRecord>> getWeightHistory(@RequestHeader("X-User-Id") String userId) {
        logger.info("[ClinicalController] Getting weight history for userHash={}", logHash(userId));
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistory(userId));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponse> getMyProfile() {
        String patientId = getCurrentUserId();
        logger.info("[ClinicalController] Getting profile for patientHash={}", logHash(patientId));
        return manageProfileUseCase.getProfileByUserId(patientId)
                .map(profile -> ResponseEntity.ok(toPatientProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/profile/me/nutritionist")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<NutritionistProfileResponse> getMyLinkedNutritionistProfile() {
        String patientId = getCurrentUserId();
        logger.info("[ClinicalController] Getting linked nutritionist profile for patientHash={}", logHash(patientId));
        return manageProfileUseCase.getProfileByUserId(patientId)
                .map(PatientProfile::getNutritionistId)
                .filter(nutritionistId -> nutritionistId != null && !nutritionistId.isBlank())
                .flatMap(manageProfileUseCase::getNutritionistProfileByUserId)
                .map(profile -> ResponseEntity.ok(toNutritionistProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/nutritionist/profile")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<Void> createNutritionistProfile(@Valid @RequestBody UpsertNutritionistProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Creating nutritionist profile for userHash={}", logHash(userId));
        manageProfileUseCase.createNutritionistProfile(toNutritionistProfile(userId, request));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/nutritionist/profile/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<NutritionistProfileResponse> updateMyNutritionistProfile(
            @Valid @RequestBody UpsertNutritionistProfileRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating nutritionist profile for userHash={}", logHash(userId));
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
        logger.info("[ClinicalController] Getting nutritionist profile for userHash={}", logHash(userId));
        return manageProfileUseCase.getNutritionistProfileByUserId(userId)
                .map(profile -> ResponseEntity.ok(toNutritionistProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/nutritionist/patients")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<List<PatientProfileResponse>> getNutritionistPatients() {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting linked patients for nutritionistHash={}", logHash(nutritionistId));
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
        logger.info("[ClinicalController] Getting patient profile for nutritionistHash={} patientHash={}",
                logHash(nutritionistId), logHash(patientId));
        PatientProfile profile = manageProfileUseCase.getProfileForNutritionist(nutritionistId, patientId);
        return ResponseEntity.ok(toPatientProfileResponse(profile));
    }

    @GetMapping("/nutritionist/reports/weight-progress")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<NutritionistWeightProgressReportResponse> getNutritionistWeightProgressReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid report range.");
        }

        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting weight progress report for nutritionistHash={} from={} to={}",
                logHash(nutritionistId), from, to);

        NutritionistWeightProgressReport report = manageProfileUseCase.getNutritionistWeightProgressReport(
                nutritionistId,
                from,
                to
        );
        return ResponseEntity.ok(toNutritionistWeightProgressReportResponse(report));
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
                request.municipality(),
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

    private HealthGoalResponse toHealthGoalResponse(HealthGoal goal) {
        return new HealthGoalResponse(
                goal.targetCalories(),
                goal.targetProtein(),
                goal.targetCarbs(),
                goal.targetFat(),
                goal.targetWaterGlasses()
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

    private NutritionistWeightProgressReportResponse toNutritionistWeightProgressReportResponse(
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

    private String getCurrentUserId() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}