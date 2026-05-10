package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.GenerateCodeResponse;
import com.healthcore.clinical.infrastructure.rest.dto.LinkPatientRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clinical/linking")
public class LinkingController {

    private final LinkingUseCase linkingUseCase;

    public LinkingController(LinkingUseCase linkingUseCase) {
        this.linkingUseCase = linkingUseCase;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<GenerateCodeResponse> generateCode() {
        String nutritionistId = getCurrentUserId();
        LinkingCode code = linkingUseCase.generateLinkingCode(nutritionistId);
        
        return ResponseEntity.ok(new GenerateCodeResponse(code.getCode(), 900));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<GenerateCodeResponse> getCurrentCode() {
        String nutritionistId = getCurrentUserId();
        LinkingCode code = linkingUseCase.getCurrentLinkingCode(nutritionistId);
        
        if (code == null) {
            return ResponseEntity.noContent().build(); 
        }
        
        long secondsElapsed = java.time.Duration.between(code.getCreatedAt(), java.time.LocalDateTime.now()).getSeconds();
        long secondsLeft = 900 - secondsElapsed;
        
        if (secondsLeft <= 0) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(new GenerateCodeResponse(code.getCode(), secondsLeft));
    }

    @PostMapping("/connect")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> connectPatient(@Valid @RequestBody LinkPatientRequest request) {
        String patientId = getCurrentUserId();
        linkingUseCase.linkPatient(patientId, request.getCode());
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/patient")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> disconnectByPatient() {
        String patientId = getCurrentUserId();
        linkingUseCase.unlinkPatient(patientId);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/nutritionist/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    public ResponseEntity<Void> disconnectByNutritionist(@PathVariable String patientId) {
        String nutritionistId = getCurrentUserId();
        linkingUseCase.unlinkNutritionist(nutritionistId, patientId);
        
        return ResponseEntity.ok().build();
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName(); 
    }
}