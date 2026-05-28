package com.healthcore.clinical.infrastructure.rest;

import java.util.List;
import java.util.stream.Collectors;

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
import org.springframework.web.bind.annotation.RestController;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.port.in.ManageObservationsUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.ApiErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.CreateObservationRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ObservationResponse;
import com.healthcore.clinical.infrastructure.rest.dto.UnauthorizedErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.UpdateObservationRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ValidationErrorResponseDoc;

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
@RequestMapping("/api/v1/clinical/observations")
@Tag(name = "Clinical Observations", description = "Clinical notes and observations shared between nutritionists and patients")
public class ObservationController {

    private final ManageObservationsUseCase manageObservationsUseCase;

    public ObservationController(ManageObservationsUseCase manageObservationsUseCase) {
        this.manageObservationsUseCase = manageObservationsUseCase;
    }

    @PostMapping
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Create clinical observation", description = "Creates a new clinical observation for a patient linked to the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Clinical observation created successfully",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid observation payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
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
    @Operation(summary = "Update clinical observation", description = "Updates a clinical observation previously created by the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clinical observation updated successfully",
                    content = @Content(schema = @Schema(implementation = ObservationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid observation payload",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponseDoc.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Observation does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Observation not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<ObservationResponse> updateObservation(
            @Parameter(description = "Identifier of the clinical observation")
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
    @Operation(summary = "Delete clinical observation", description = "Deletes a clinical observation created by the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Clinical observation deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Observation does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Observation not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> deleteObservation(
            @Parameter(description = "Identifier of the clinical observation")
            @PathVariable String observationId) {
        String nutritionistId = getCurrentUserId();
        manageObservationsUseCase.deleteObservation(observationId, nutritionistId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "List linked patient observations", description = "Returns the clinical observations for a linked patient from the perspective of the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clinical observations returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ObservationResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient or clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<List<ObservationResponse>> getPatientObservations(
            @Parameter(description = "Identifier of the linked patient")
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
    @Operation(summary = "List my clinical observations", description = "Returns the clinical observations visible to the authenticated patient.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clinical observations returned successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ObservationResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
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
