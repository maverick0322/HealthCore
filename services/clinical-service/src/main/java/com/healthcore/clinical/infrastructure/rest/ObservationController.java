package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.port.in.ManageObservationsUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.CreateObservationRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ObservationResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/clinical/observations")
public class ObservationController {

    private final ManageObservationsUseCase manageObservationsUseCase;

    public ObservationController(ManageObservationsUseCase manageObservationsUseCase) {
        this.manageObservationsUseCase = manageObservationsUseCase;
    }

    @PostMapping
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<ObservationResponse> recordObservation(
            @RequestHeader("X-User-Id") String nutritionistId,
            @RequestBody CreateObservationRequest request) {
        ClinicalObservation observation = manageObservationsUseCase.recordObservation(
                request.patientId(),
                nutritionistId,
                request.note()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(observation));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<List<ObservationResponse>> getPatientObservations(
            @RequestHeader("X-User-Id") String nutritionistId,
            @PathVariable String patientId) {
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
    public ResponseEntity<List<ObservationResponse>> getMyObservations(
            @RequestHeader("X-User-Id") String patientId) {
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
}
