package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.HealthGoal;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.model.WeightRecord;
import com.healthcore.clinical.domain.port.in.ManageProfileUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.ApiErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UnauthorizedErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateProfilePhotoRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ValidationErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.mapper.ClinicalProfileRestMapper;
import com.healthcore.clinical.infrastructure.rest.support.ClinicalControllerSupport;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/clinical")
@Tag(name = "Patient Clinical Profiles", description = "Clinical record operations for authenticated patients")
public class PatientClinicalController extends ClinicalControllerSupport {

    private static final Logger logger = LoggerFactory.getLogger(PatientClinicalController.class);

    private final ManageProfileUseCase manageProfileUseCase;

    public PatientClinicalController(
            ManageProfileUseCase manageProfileUseCase,
            ClinicalProfileRestMapper clinicalProfileRestMapper,
            ProfilePhotoUrlResolver profilePhotoUrlResolver
    ) {
        super(clinicalProfileRestMapper, profilePhotoUrlResolver);
        this.manageProfileUseCase = manageProfileUseCase;
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create patient clinical profile", description = "Creates the initial clinical profile for the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clinical profile created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid profile payload",
                    content = @Content(schema = @Schema(
                            oneOf = {ValidationErrorResponseDoc.class, ApiErrorResponseDoc.class}
                    ))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> createProfile(@Valid @RequestBody CreateProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Creating patient profile for userHash={}", logHash(userId));
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
                    content = @Content(schema = @Schema(
                            oneOf = {ValidationErrorResponseDoc.class, ApiErrorResponseDoc.class}
                    ))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> updateMyProfile(@Valid @RequestBody CreateProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Updating patient profile for userHash={}", logHash(userId));
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
                    content = @Content(schema = @Schema(
                            oneOf = {ValidationErrorResponseDoc.class, ApiErrorResponseDoc.class}
                    ))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required or profile photo key does not belong to the authenticated patient",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<PatientProfileResponse> updateMyProfilePhoto(
            @Valid @RequestBody UpdateProfilePhotoRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Updating patient profile photo for userHash={}", logHash(userId));
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
            @ApiResponse(responseCode = "404", description = "Clinical profile not found", content = @Content),
            @ApiResponse(responseCode = "409", description = "Goals cannot be derived because the profile is incomplete",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> getMyGoals() {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Getting goals for userHash={}", logHash(userId));
        Optional<PatientProfile> profileOpt = manageProfileUseCase.getProfileByUserId(userId);

        if (profileOpt.isEmpty()) {
            logger.warn("[PatientClinicalController] No profile found for userHash={}", logHash(userId));
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
                    content = @Content(schema = @Schema(
                            oneOf = {ValidationErrorResponseDoc.class, ApiErrorResponseDoc.class}
                    ))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Goals cannot be recalculated in the current clinical record state",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> updateWeight(@Valid @RequestBody UpdateWeightRequest request) {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Updating weight for userHash={} weightKg={} date={}",
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
                    content = @Content(schema = @Schema(
                            oneOf = {ValidationErrorResponseDoc.class, ApiErrorResponseDoc.class}
                    ))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Goals cannot be recalculated in the current clinical record state",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> editWeight(
            @Parameter(description = "Original date of the weight record to edit in YYYY-MM-DD format")
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate originalDate,
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Editing weight for userHash={} originalDate={} weightKg={} date={}",
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
            @ApiResponse(responseCode = "404", description = "Clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Operation cannot be completed in the current clinical record state",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<HealthGoalResponse> deleteWeight(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        String userId = getCurrentUserId();
        logger.info("[PatientClinicalController] Deleting weight for userHash={} date={}", logHash(userId), date);
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
        logger.info("[PatientClinicalController] Getting weight history for userHash={}", logHash(userId));
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistory(userId));
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
            @ApiResponse(responseCode = "404", description = "Clinical profile not found", content = @Content)
    })
    public ResponseEntity<PatientProfileResponse> getMyProfile() {
        String patientId = getCurrentUserId();
        logger.info("[PatientClinicalController] Getting profile for patientHash={}", logHash(patientId));
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
            @ApiResponse(responseCode = "404", description = "No linked nutritionist profile is available", content = @Content)
    })
    public ResponseEntity<NutritionistProfileResponse> getMyLinkedNutritionistProfile() {
        String patientId = getCurrentUserId();
        logger.info("[PatientClinicalController] Getting linked nutritionist profile for patientHash={}", logHash(patientId));
        return manageProfileUseCase.getProfileByUserId(patientId)
                .map(PatientProfile::getNutritionistId)
                .filter(nutritionistId -> nutritionistId != null && !nutritionistId.isBlank())
                .flatMap(manageProfileUseCase::getNutritionistProfileByUserId)
                .map(profile -> ResponseEntity.ok(toNutritionistProfileResponse(profile)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
