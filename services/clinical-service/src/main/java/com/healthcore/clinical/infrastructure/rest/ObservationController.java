package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.port.in.ManageObservationsUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.CreateObservationRequest;
import com.healthcore.clinical.infrastructure.rest.dto.ObservationResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public ResponseEntity<ObservationResponse> recordObservation(@RequestBody CreateObservationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nutritionistId = auth.getName(); 

        ClinicalObservation observation = manageObservationsUseCase.recordObservation(
                request.patientId(),
                nutritionistId,
                request.note()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(observation));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ObservationResponse>> getPatientObservations(@PathVariable String patientId) {
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