package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.port.in.ManageObservationsUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.CreateObservationRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ObservationResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateObservationRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/clinical/observations")
@Tag(name = "Clinical Observations", description = "Notas y observaciones clínicas entre nutriólogo y paciente")
public class ObservationController {

    private final ManageObservationsUseCase manageObservationsUseCase;

    public ObservationController(ManageObservationsUseCase manageObservationsUseCase) {
        this.manageObservationsUseCase = manageObservationsUseCase;
    }

    @PostMapping
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Crear observación clínica", description = "Registra una nueva observación clínica para un paciente vinculado al nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Observación creada exitosamente",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos de observación inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "El paciente no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Paciente o perfil clínico no encontrado")
    })
    public ResponseEntity<ObservationResponse> recordObservation(
            @Valid @RequestBody CreateObservationRequest request) {
        String nutritionistId = getCurrentUserId();
        ClinicalObservation observation = manageObservationsUseCase.recordObservation(
                request.patientId(),
                nutritionistId,
                request.note()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(observation));
    }

    @PutMapping("/{observationId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Actualizar observación clínica", description = "Actualiza una observación previamente registrada por el nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Observación actualizada exitosamente",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Datos de observación inválidos"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "La observación no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Observación no encontrada")
    })
    public ResponseEntity<ObservationResponse> updateObservation(
            @Parameter(description = "Identificador de la observación clínica")
            @PathVariable String observationId,
            @Valid @RequestBody UpdateObservationRequest request) {
        String nutritionistId = getCurrentUserId();
        ClinicalObservation observation = manageObservationsUseCase.updateObservation(
                observationId,
                nutritionistId,
                request.note()
        );

        return ResponseEntity.ok(toResponse(observation));
    }

    @DeleteMapping("/{observationId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Eliminar observación clínica", description = "Elimina una observación clínica registrada por el nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Observación eliminada exitosamente"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "La observación no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Observación no encontrada")
    })
    public ResponseEntity<Void> deleteObservation(
            @Parameter(description = "Identificador de la observación clínica")
            @PathVariable String observationId) {
        String nutritionistId = getCurrentUserId();
        manageObservationsUseCase.deleteObservation(observationId, nutritionistId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Listar observaciones de un paciente vinculado", description = "Devuelve las observaciones clínicas de un paciente para el nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Observaciones obtenidas exitosamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ObservationResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "El paciente no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "Paciente o perfil clínico no encontrado")
    })
    public ResponseEntity<List<ObservationResponse>> getPatientObservations(
            @Parameter(description = "Identificador del paciente vinculado")
            @PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        List<ObservationResponse> observations = manageObservationsUseCase.getPatientObservations(
                        patientId,
                        nutritionistId
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(observations);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Listar mis observaciones clínicas", description = "Devuelve las observaciones clínicas visibles para el paciente autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Observaciones obtenidas exitosamente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ObservationResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes")
    })
    public ResponseEntity<List<ObservationResponse>> getMyObservations() {
        String patientId = getCurrentUserId();
        List<ObservationResponse> observations = manageObservationsUseCase.getPatientObservations(patientId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(observations);
    }

    private ObservationResponse toResponse(ClinicalObservation domain) {
        return new ObservationResponse(
                domain.getId(),
                domain.getPatientId(),
                domain.getNutritionistId(),
                domain.getNote(),
                domain.getCreatedAt()
        );
    }

    private String getCurrentUserId() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }
}
