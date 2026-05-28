package com.healthcore.clinical.infrastructure.rest;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
import com.healthcore.clinical.infrastructure.grpc.MediaGrpcClientAdapter;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ClinicAddressResponse;
import com.healthcore.clinical.infrastructure.rest.dto.CreateProfileRequest;
import com.healthcore.clinical.infrastructure.rest.dto.HealthGoalResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressReportResponse;
import com.healthcore.clinical.infrastructure.rest.dto.NutritionistWeightProgressRowResponse;
import com.healthcore.clinical.infrastructure.rest.dto.PatientProfileResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateProfilePhotoRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdatePatientMetricsRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateWeightRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UpsertNutritionistProfileRequest;
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
@Tag(name = "Clinical Profiles", description = "Operaciones del expediente clínico para pacientes y nutriólogos")
public class ClinicalController {

    private static final Logger logger = LoggerFactory.getLogger(ClinicalController.class);

    private final ManageProfileUseCase manageProfileUseCase;
    private final MediaGrpcClientAdapter mediaGrpcClientAdapter;

    public ClinicalController(
            ManageProfileUseCase manageProfileUseCase,
            MediaGrpcClientAdapter mediaGrpcClientAdapter
    ) {
        this.manageProfileUseCase = manageProfileUseCase;
        this.mediaGrpcClientAdapter = mediaGrpcClientAdapter;
    }

    @PostMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Crear perfil clínico del paciente", description = "Crea el perfil clínico inicial del paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil clínico creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de perfil inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "409", description = "El perfil no puede crearse por el estado actual")
    })
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
    @Operation(summary = "Actualizar mi perfil clínico", description = "Actualiza de forma completa el perfil clínico del paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil actualizado exitosamente",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos de perfil inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Perfil clínico no encontrado")
    })
    public ResponseEntity<PatientProfileResponse> updateMyProfile(@Valid @RequestBody CreateProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating patient profile for userHash={}", logHash(userId));
        PatientProfile updatedProfile = manageProfileUseCase.updateProfile(userId, toPatientProfile(userId, request));
        return ResponseEntity.ok(toPatientProfileResponse(updatedProfile));
    }

    @PutMapping("/profile/me/photo")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Actualizar foto de perfil del paciente", description = "Asocia una nueva foto de perfil al paciente autenticado usando la storage key previamente subida a media-service.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Foto de perfil actualizada exitosamente",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Storage key inválida"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Perfil clínico no encontrado")
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
    @Operation(summary = "Consultar mis metas nutricionales", description = "Devuelve las metas diarias derivadas del perfil biométrico actual del paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metas obtenidas exitosamente",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Perfil clínico no encontrado")
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
    @Operation(summary = "Registrar peso del paciente", description = "Registra o reemplaza el peso del paciente autenticado para la fecha indicada y recalcula sus metas diarias.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Peso registrado y metas recalculadas",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "400", description = "Peso o fecha inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Perfil clínico no encontrado")
    })
    public ResponseEntity<HealthGoalResponse> updateWeight(
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Updating weight for userHash={} weightKg={} date={}",
                logHash(userId), request.weightKg(), request.date());
        HealthGoal newGoal = manageProfileUseCase.updateWeight(userId, request.weightKg(), request.date());
        return ResponseEntity.ok(toHealthGoalResponse(newGoal));
    }

    @PutMapping("/weight/{originalDate}")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Editar registro de peso", description = "Modifica un registro de peso existente del paciente autenticado y recalcula sus metas diarias.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro editado exitosamente",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "400", description = "Peso o fecha inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Registro de peso o perfil no encontrado")
    })
    public ResponseEntity<HealthGoalResponse> editWeight(
            @Parameter(description = "Fecha original del registro a editar en formato YYYY-MM-DD")
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate originalDate,
            @Valid @RequestBody UpdateWeightRequest request
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Editing weight for userHash={} originalDate={} weightKg={} date={}",
                logHash(userId), originalDate, request.weightKg(), request.date());
        HealthGoal newGoal = manageProfileUseCase.editWeight(userId, originalDate, request.weightKg(), request.date());
        return ResponseEntity.ok(toHealthGoalResponse(newGoal));
    }

    @DeleteMapping("/weight/{date}")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Eliminar registro de peso", description = "Elimina un registro de peso del paciente autenticado y recalcula sus metas con el historial restante.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registro eliminado exitosamente",
                    content = @Content(schema = @Schema(implementation = HealthGoalResponse.class))),
            @ApiResponse(responseCode = "400", description = "Fecha inválida"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Registro de peso o perfil no encontrado"),
            @ApiResponse(responseCode = "409", description = "La operación no puede completarse por el estado actual del expediente")
    })
    public ResponseEntity<HealthGoalResponse> deleteWeight(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Deleting weight for userHash={} date={}", logHash(userId), date);
        HealthGoal newGoal = manageProfileUseCase.deleteWeight(userId, date);
        return ResponseEntity.ok(toHealthGoalResponse(newGoal));
    }

    @GetMapping("/weight/history")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Consultar historial de peso del paciente", description = "Devuelve el historial de peso del paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historial obtenido exitosamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WeightRecord.class)))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Perfil clínico no encontrado")
    })
    public ResponseEntity<List<WeightRecord>> getWeightHistory() {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Getting weight history for userHash={}", logHash(userId));
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistory(userId));
    }

    @GetMapping("/nutritionist/patients/{patientId}/weight-history")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Consultar historial de peso de un paciente vinculado", description = "Devuelve el historial de peso de un paciente para el nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historial obtenido exitosamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WeightRecord.class)))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "El paciente no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Paciente o perfil clínico no encontrado")
    })
    public ResponseEntity<List<WeightRecord>> getNutritionistPatientWeightHistory(
            @Parameter(description = "Identificador del paciente vinculado")
            @PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting patient weight history for nutritionistHash={} patientHash={}",
                logHash(nutritionistId), logHash(patientId));
        return ResponseEntity.ok(manageProfileUseCase.getWeightHistoryForNutritionist(nutritionistId, patientId));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Consultar mi perfil clínico", description = "Devuelve el expediente clínico del paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil obtenido exitosamente",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "Perfil clínico no encontrado")
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
    @Operation(summary = "Consultar perfil del nutriólogo vinculado", description = "Devuelve el perfil público del nutriólogo asociado al paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil del nutriólogo obtenido exitosamente",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "No existe perfil vinculado disponible")
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
    @Operation(summary = "Crear perfil profesional del nutriólogo", description = "Crea el perfil profesional inicial del nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil profesional creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos de perfil inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos"),
            @ApiResponse(responseCode = "409", description = "El perfil no puede crearse por el estado actual")
    })
    public ResponseEntity<Void> createNutritionistProfile(@Valid @RequestBody UpsertNutritionistProfileRequest request) {
        String userId = getCurrentUserId();
        logger.info("[ClinicalController] Creating nutritionist profile for userHash={}", logHash(userId));
        manageProfileUseCase.createNutritionistProfile(toNutritionistProfile(userId, request));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/nutritionist/profile/me")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Actualizar mi perfil profesional", description = "Actualiza el perfil profesional del nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil profesional actualizado exitosamente",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos de perfil inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos"),
            @ApiResponse(responseCode = "404", description = "Perfil profesional no encontrado")
    })
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

    @PutMapping("/nutritionist/profile/me/photo")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Actualizar foto de perfil del nutriólogo", description = "Asocia una nueva foto de perfil al nutriólogo autenticado usando una storage key de media-service.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Foto de perfil actualizada exitosamente",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Storage key inválida"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos"),
            @ApiResponse(responseCode = "404", description = "Perfil profesional no encontrado")
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
    @Operation(summary = "Consultar mi perfil profesional", description = "Devuelve el perfil profesional del nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil obtenido exitosamente",
                    content = @Content(schema = @Schema(implementation = NutritionistProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos"),
            @ApiResponse(responseCode = "404", description = "Perfil profesional no encontrado")
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
    @Operation(summary = "Listar pacientes vinculados", description = "Devuelve los expedientes base de los pacientes vinculados al nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pacientes obtenidos exitosamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PatientProfileResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos")
    })
    public ResponseEntity<List<PatientProfileResponse>> getNutritionistPatients() {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting linked patients for nutritionistHash={}", logHash(nutritionistId));
        List<PatientProfile> linkedProfiles = manageProfileUseCase.getProfilesByNutritionistId(nutritionistId);
        Map<String, String> profilePhotoUrls = resolveProfilePhotoUrls(
                linkedProfiles.stream()
                        .map(PatientProfile::getProfilePhotoKey)
                        .toList()
        );
        List<PatientProfileResponse> patients = linkedProfiles
                .stream()
                .map(profile -> toPatientProfileResponse(
                        profile,
                        profilePhotoUrls.get(profile.getProfilePhotoKey())
                ))
                .toList();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/nutritionist/patients/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Consultar expediente base de un paciente vinculado", description = "Devuelve el expediente clínico base de un paciente para el nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Expediente obtenido exitosamente",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "El paciente no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Paciente o perfil clínico no encontrado")
    })
    public ResponseEntity<PatientProfileResponse> getNutritionistPatientProfile(
            @Parameter(description = "Identificador del paciente vinculado")
            @PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        logger.info("[ClinicalController] Getting patient profile for nutritionistHash={} patientHash={}",
                logHash(nutritionistId), logHash(patientId));
        PatientProfile profile = manageProfileUseCase.getProfileForNutritionist(nutritionistId, patientId);
        return ResponseEntity.ok(toPatientProfileResponse(profile));
    }

    @PutMapping("/nutritionist/patients/{patientId}/metrics")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Actualizar métricas clínicas del paciente", description = "Permite al nutriólogo actualizar peso y altura del paciente vinculado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Métricas actualizadas exitosamente",
                    content = @Content(schema = @Schema(implementation = PatientProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Peso o altura inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "El paciente no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Paciente o perfil clínico no encontrado")
    })
    public ResponseEntity<PatientProfileResponse> updateNutritionistPatientMetrics(
            @Parameter(description = "Identificador del paciente vinculado")
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
    @Operation(summary = "Consultar reporte de progreso de peso", description = "Devuelve el reporte consolidado de evolución de peso para los pacientes vinculados al nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reporte obtenido exitosamente",
                    content = @Content(schema = @Schema(implementation = NutritionistWeightProgressReportResponse.class))),
            @ApiResponse(responseCode = "400", description = "Rango de fechas inválido"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos"),
            @ApiResponse(responseCode = "404", description = "No se encontró información clínica para el rango solicitado")
    })
    public ResponseEntity<NutritionistWeightProgressReportResponse> getNutritionistWeightProgressReport(
            @Parameter(description = "Fecha inicial del reporte en formato YYYY-MM-DD")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Fecha final del reporte en formato YYYY-MM-DD")
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
                request.bio(),
                null
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
        return toPatientProfileResponse(profile, resolveProfilePhotoUrl(profile.getProfilePhotoKey()));
    }

    private PatientProfileResponse toPatientProfileResponse(PatientProfile profile, String profilePhotoUrl) {
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
                resolveProfilePhotoUrl(profile.getProfilePhotoKey()),
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

    private String resolveProfilePhotoUrl(String profilePhotoKey) {
        return mediaGrpcClientAdapter.getPresignedReadUrl(profilePhotoKey);
    }

    private Map<String, String> resolveProfilePhotoUrls(List<String> profilePhotoKeys) {
        return mediaGrpcClientAdapter.getPresignedReadUrls(profilePhotoKeys);
    }

    private String logHash(String value) {
        return value == null || value.isBlank() ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
