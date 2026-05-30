package com.healthcore.clinical.infrastructure.rest;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.model.NutritionistWeightProgressReport;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.ApiErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressReportResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UnauthorizedErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.UpdatePatientMetricsRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateProfilePhotoRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ValidationErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.mapper.ClinicalProfileRestMapper;
import com.healthcore.clinical.infrastructure.rest.support.ProfilePhotoUrlResolver;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/clinical")
@Tag(name = "Clinical Profiles", description = "Clinical record operations for patients and nutritionists")
public class ClinicalController {

    private static final Logger logger = LoggerFactory.getLogger(ClinicalController.class);

    private final ManageProfileUseCase manageProfileUseCase;
    private final ClinicalProfileRestMapper clinicalProfileRestMapper;
    private final ProfilePhotoUrlResolver profilePhotoUrlResolver;

    public ClinicalController(
            ManageProfileUseCase manageProfileUseCase,
            ClinicalProfileRestMapper clinicalProfileRestMapper,
            ProfilePhotoUrlResolver profilePhotoUrlResolver
    ) {
        this.manageProfileUseCase = manageProfileUseCase;
        this.clinicalProfileRestMapper = clinicalProfileRestMapper;
        this.profilePhotoUrlResolver = profilePhotoUrlResolver;
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create patient clinical profile", description = "Creates the initial clinical profile for the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clinical profile created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid profile payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Profile cannot be created in the current state",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> createProfile(
            @Valid @RequestBody CreateProfileRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Creating patient profile for userHash={}", logHash(userId));
        manageProfileUseCase.createProfile(clinicalProfileRestMapper.toPatientProfile(userId, request));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Update my clinical profile", description = "Fully replaces the clinical profile of the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile updated successfully",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid profile payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> updateMyProfile(@Valid @RequestBody CreateProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating patient profile for userHash={}", logHash(userId));
        PatientProfile updatedProfile = manageProfileUseCase.updateProfile(
                userId,
                clinicalProfileRestMapper.toPatientProfile(userId, request)
        );
        return ResponseEntity.ok(toPatientProfileResponse(updatedProfile));
    }

    @PutMapping("/profile/me/photo")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Update patient profile photo", description = "Associates a new profile photo with the authenticated patient using a storage key previously uploaded to media-service.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile photo updated successfully",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid storage key payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> updateMyProfilePhoto(
            @Valid @RequestBody UpdateProfilePhotoRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating patient profile photo for userHash={}", logHash(userId));
        PatientProfile updatedProfile = manageProfileUseCase.updateProfilePhoto(userId, request.profilePhotoKey());
        return ResponseEntity.ok(toPatientProfileResponse(updatedProfile));
    }

    @GetMapping("/goals/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get my nutrition goals", description = "Returns the daily goals derived from the current biometric profile of the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Goals returned successfully",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> getMyGoals() {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Getting goals for userHash={}", logHash(userId));
        Optional<PatientProfile> profileOpt = manageProfileUseCase.getProfileByUserId(userId);

        if (profileOpt.isEmpty()) {
            logger.warn("[ClinicalController] No profile found for userHash={}", logHash(userId));
            return ResponseEntity.notFound().build();
        }

        HealthGoal goal = profileOpt.get().generateHealthGoals();
        return ResponseEntity.ok(clinicalProfileRestMapper.toHealthGoalResponse(goal));
    }

    @PostMapping("/weight")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Record patient weight", description = "Creates or replaces the weight record for the authenticated patient on the requested date and recalculates daily goals.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Weight saved and goals recalculated successfully",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid weight payload or date",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> updateWeight(
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating weight for userHash={} weightKg={} date={}",
                logHash(userId), request.weightKg(), request.date());
        HealthGoal newGoal = manageProfileUseCase.updateWeight(userId, request.weightKg(), request.date());
        return ResponseEntity.ok(clinicalProfileRestMapper.toHealthGoalResponse(newGoal));
    }

    @PutMapping("/weight/{originalDate}")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Edit weight record", description = "Updates an existing weight record for the authenticated patient and recalculates daily goals.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Weight record updated successfully",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid weight payload or date",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Weight record or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> editWeight(
            @Parameter(description = "Original date of the weight record to edit in YYYY-MM-DD format")
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate originalDate,
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Editing weight for userHash={} originalDate={} weightKg={} date={}",
                logHash(userId), originalDate, request.weightKg(), request.date());
        HealthGoal newGoal = manageProfileUseCase.editWeight(userId, originalDate, request.weightKg(), request.date());
        return ResponseEntity.ok(clinicalProfileRestMapper.toHealthGoalResponse(newGoal));
    }

    @DeleteMapping("/weight/{date}")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Delete weight record", description = "Deletes a weight record for the authenticated patient and recalculates goals with the remaining history.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Weight record deleted successfully",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid date",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Weight record or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Operation cannot be completed in the current clinical record state",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> deleteWeight(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Deleting weight for userHash={} date={}", logHash(userId), date);
        HealthGoal newGoal = manageProfileUseCase.deleteWeight(userId, date);
        return ResponseEntity.ok(clinicalProfileRestMapper.toHealthGoalResponse(newGoal));
    }

    @GetMapping("/weight/history")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get patient weight history", description = "Returns the weight history of the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Weight history returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WeightRecord.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<List<WeightRecord>> getWeightHistory() {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Getting weight history for userHash={}", logHash(userId));
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistory(userId));
    }

    @GetMapping("/nutritionist/patients/{patientId}/weight-history")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Get linked patient weight history", description = "Returns the weight history of a patient for the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Weight history returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WeightRecord.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<List<WeightRecord>> getNutritionistPatientWeightHistory(
            @Parameter(description = "Identifier of the linked patient")
            @PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting patient weight history for nutritionistHash={} patientHash={}",
                logHash(nutritionistId), logHash(patientId));
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistoryForNutritionist(nutritionistId, patientId));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get my clinical profile", description = "Returns the clinical record of the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clinical profile returned successfully",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> getMyProfile() {
        String patientId = getCurrentUserId();
        logger.info("[ClinicalController] Getting profile for patientHash={}", logHash(patientId));
        return manageProfileUseCase.getProfileByUserId(patientId)
                .map(profile -> ResponseEntity.ok(toPatientProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/profile/me/nutritionist")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get linked nutritionist profile", description = "Returns the public nutritionist profile associated with the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Linked nutritionist profile returned successfully",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "No linked nutritionist profile is available",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
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
    @Operation(summary = "Create nutritionist professional profile", description = "Creates the initial professional profile for the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Professional profile created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid professional profile payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Professional profile cannot be created in the current state",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> createNutritionistProfile(@Valid @RequestBody UpsertNutritionistProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Creating nutritionist profile for userHash={}", logHash(userId));
        manageProfileUseCase.createNutritionistProfile(
                clinicalProfileRestMapper.toNutritionistProfile(userId, request)
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/nutritionist/profile/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Update my professional profile", description = "Updates the professional profile of the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Professional profile updated successfully",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid professional profile payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Professional profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionistProfileResponse> updateMyNutritionistProfile(
            @Valid @RequestBody UpsertNutritionistProfileRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating nutritionist profile for userHash={}", logHash(userId));
        NutritionistProfile updatedProfile = manageProfileUseCase.updateNutritionistProfile(
                userId,
                clinicalProfileRestMapper.toNutritionistProfile(userId, request)
        );
        return ResponseEntity.ok(toNutritionistProfileResponse(updatedProfile));
    }

    @PutMapping("/nutritionist/profile/me/photo")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Update nutritionist profile photo", description = "Associates a new profile photo with the authenticated nutritionist using a storage key from media-service.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile photo updated successfully",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid storage key payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Professional profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionistProfileResponse> updateMyNutritionistProfilePhoto(
            @Valid @RequestBody UpdateProfilePhotoRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating nutritionist profile photo for userHash={}", logHash(userId));
        NutritionistProfile updatedProfile = manageProfileUseCase.updateNutritionistProfilePhoto(
                userId,
                request.profilePhotoKey()
        );
        return ResponseEntity.ok(toNutritionistProfileResponse(updatedProfile));
    }

    @GetMapping("/nutritionist/profile/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Get my professional profile", description = "Returns the professional profile of the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Professional profile returned successfully",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Professional profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionistProfileResponse> getMyNutritionistProfile() {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Getting nutritionist profile for userHash={}", logHash(userId));
        return manageProfileUseCase.getNutritionistProfileByUserId(userId)
                .map(profile -> ResponseEntity.ok(toNutritionistProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/nutritionist/patients")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "List linked patients", description = "Returns the basic clinical records of the patients linked to the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Linked patients returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PatientProfileResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<List<PatientProfileResponse>> getNutritionistPatients() {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting linked patients for nutritionistHash={}", logHash(nutritionistId));
        List<PatientProfile> linkedProfiles = manageProfileUseCase.getProfilesByNutritionistId(nutritionistId);
        var profilePhotoUrls = profilePhotoUrlResolver.resolveBatchUrls(
                linkedProfiles.stream()
                        .map(PatientProfile::getProfilePhotoKey)
                        .toList()
        );
        List<PatientProfileResponse> patients = linkedProfiles
                .stream()
                .map(profile -> toPatientProfileResponse(
                        profile,
                        profilePhotoUrlResolver.resolveResolvedUrl(profilePhotoUrls, profile.getProfilePhotoKey())
                ))
                .toList();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/nutritionist/patients/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Get linked patient base profile", description = "Returns the base clinical profile of a patient for the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Linked patient profile returned successfully",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> getNutritionistPatientProfile(
            @Parameter(description = "Identifier of the linked patient")
            @PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting patient profile for nutritionistHash={} patientHash={}",
                logHash(nutritionistId), logHash(patientId));
        PatientProfile profile = manageProfileUseCase.getProfileForNutritionist(nutritionistId, patientId);
        return ResponseEntity.ok(toPatientProfileResponse(profile));
    }

    @PutMapping("/nutritionist/patients/{patientId}/metrics")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Update patient clinical metrics", description = "Allows the authenticated nutritionist to update the weight and height of a linked patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Patient metrics updated successfully",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid patient metrics payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> updateNutritionistPatientMetrics(
            @Parameter(description = "Identifier of the linked patient")
            @PathVariable String patientId,
            @Valid @RequestBody UpdatePatientMetricsRequest request
    ) {
        String nutritionistId = getCurrentUserId();
        logger.info(
                "[ClinicalController] Updating patient metrics for nutritionistHash={} patientHash={} weightKg={} heightCm={}",
                logHash(nutritionistId),
                logHash(patientId),
                request.weightKg(),
                request.heightCm()
        );
        PatientProfile updatedProfile = manageProfileUseCase.updatePatientMetricsForNutritionist(
                nutritionistId,
                patientId,
                request.weightKg(),
                request.heightCm()
        );
        return ResponseEntity.ok(toPatientProfileResponse(updatedProfile));
    }

    @GetMapping("/nutritionist/reports/weight-progress")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Get weight progress report", description = "Returns the consolidated weight progress report for the patients linked to the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Weight progress report returned successfully",
                    content = @Content(schema = @Schema(implementation = NutritionistWeightProgressReportResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid report date range",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "No clinical information found for the requested range",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<NutritionistWeightProgressReportResponse> getNutritionistWeightProgressReport(
            @Parameter(description = "Start date of the report in YYYY-MM-DD format")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date of the report in YYYY-MM-DD format")
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
        return ResponseEntity.ok(clinicalProfileRestMapper.toNutritionistWeightProgressReportResponse(report));
    }

    private PatientProfileResponse toPatientProfileResponse(PatientProfile profile) {
        return toPatientProfileResponse(
                profile,
                profilePhotoUrlResolver.resolveSingleUrl(profile.getProfilePhotoKey())
        );
    }

    private PatientProfileResponse toPatientProfileResponse(PatientProfile profile, String profilePhotoUrl) {
        return clinicalProfileRestMapper.toPatientProfileResponse(profile, profilePhotoUrl);
    }

    private NutritionistProfileResponse toNutritionistProfileResponse(NutritionistProfile profile) {
        return clinicalProfileRestMapper.toNutritionistProfileResponse(
                profile,
                profilePhotoUrlResolver.resolveSingleUrl(profile.getProfilePhotoKey())
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
