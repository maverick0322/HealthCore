package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.GenerateCodeResponse;
import com.healthcore.clinical.infrastructure.rest.dto.LinkPatientRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/clinical/linking")
public class LinkingController {
    
    private static final Logger log = LoggerFactory.getLogger(LinkingController.class);

    private final LinkingUseCase linkingUseCase;

    public LinkingController(LinkingUseCase linkingUseCase) {
        this.linkingUseCase = linkingUseCase;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<GenerateCodeResponse> generateCode() {
        String nutritionistId = getCurrentUserId();
        log.info("Generating linking code for nutritionist: {}", nutritionistId);
        LinkingCode code = linkingUseCase.generateLinkingCode(nutritionistId);
        
        return ResponseEntity.ok(toGenerateCodeResponse(code));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<GenerateCodeResponse> getCurrentCode() {
        String nutritionistId = getCurrentUserId();
        log.info("Retrieving current linking code for nutritionist: {}", nutritionistId);
        LinkingCode code = linkingUseCase.getCurrentLinkingCode(nutritionistId);
        
        if (code == null) {
            log.debug("No current linking code found for nutritionist: {}", nutritionistId);
            return ResponseEntity.noContent().build(); 
        }

        return ResponseEntity.ok(toGenerateCodeResponse(code));
    }

    @PostMapping("/connect")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> connectPatient(@Valid @RequestBody LinkPatientRequest request) {
        String patientId = getCurrentUserId();
        log.info("Patient {} attempting to link with code: {}", patientId, request.getCode());
        linkingUseCase.linkPatient(patientId, request.getCode());
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/patient")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> disconnectByPatient() {
        String patientId = getCurrentUserId();
        log.info("Patient {} requesting disconnection from nutritionist", patientId);
        linkingUseCase.unlinkPatient(patientId);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/nutritionist/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<Void> disconnectByNutritionist(@PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        log.info("Nutritionist {} requesting disconnection from patient {}", nutritionistId, patientId);
        linkingUseCase.unlinkNutritionist(nutritionistId, patientId);
        
        return ResponseEntity.ok().build();
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("Authentication is null or not authenticated");
            throw new IllegalStateException("User is not authenticated");
        }
        String userId = authentication.getName();
        if (userId == null || userId.isEmpty()) {
            log.error("User ID is null or empty");
            throw new IllegalStateException("User ID cannot be null or empty");
        }
        return userId;
    }

    private GenerateCodeResponse toGenerateCodeResponse(LinkingCode code) {
        long secondsElapsed = Duration.between(code.getCreatedAt(), LocalDateTime.now()).getSeconds();
        long secondsLeft = (LinkingCode.TTL_MINUTES * 60) - secondsElapsed;
        return new GenerateCodeResponse(code.getCode(), Math.max(secondsLeft, 0));
    }
}
