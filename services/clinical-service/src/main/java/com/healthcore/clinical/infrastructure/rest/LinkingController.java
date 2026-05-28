package com.healthcore.clinical.infrastructure.rest;

import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.GenerateCodeResponse;
import com.healthcore.clinical.infrastructure.rest.dto.LinkPatientRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Clinical Linking", description = "Operaciones para vincular y desvincular pacientes con nutriólogos")
public class LinkingController {
    
    private static final Logger log = LoggerFactory.getLogger(LinkingController.class);

    private final LinkingUseCase linkingUseCase;

    public LinkingController(LinkingUseCase linkingUseCase) {
        this.linkingUseCase = linkingUseCase;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Generar código de vinculación", description = "Genera un código temporal para que un paciente pueda vincularse con el nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Código generado exitosamente",
                    content = @Content(schema = @Schema(implementation = GenerateCodeResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos")
    })
    public ResponseEntity<GenerateCodeResponse> generateCode() {
        String nutritionistId = getCurrentUserId();
        log.info("Generating linking code for nutritionist: {}", nutritionistId);
        LinkingCode code = linkingUseCase.generateLinkingCode(nutritionistId);
        
        return ResponseEntity.ok(toGenerateCodeResponse(code));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Consultar código de vinculación vigente", description = "Devuelve el código activo del nutriólogo autenticado o 204 si no existe uno vigente.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Código vigente obtenido exitosamente",
                    content = @Content(schema = @Schema(implementation = GenerateCodeResponse.class))),
            @ApiResponse(responseCode = "204", description = "No existe un código de vinculación vigente"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a nutriólogos")
    })
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
    @Operation(summary = "Vincular paciente con código", description = "Vincula al paciente autenticado con un nutriólogo usando un código temporal válido.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paciente vinculado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Código de vinculación inválido o expirado"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "409", description = "El paciente ya está vinculado a otro nutriólogo")
    })
    public ResponseEntity<Void> connectPatient(@Valid @RequestBody LinkPatientRequest request) {
        String patientId = getCurrentUserId();
        log.info("Patient {} attempting to link with code: {}", patientId, request.getCode());
        linkingUseCase.linkPatient(patientId, request.getCode());
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/patient")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Desvincularme de mi nutriólogo", description = "Rompe la relación clínica del paciente autenticado con su nutriólogo actual y dispara la limpieza asociada.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paciente desvinculado exitosamente"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "Operación restringida a pacientes"),
            @ApiResponse(responseCode = "404", description = "No existe una vinculación activa"),
            @ApiResponse(responseCode = "503", description = "No fue posible completar la limpieza remota con agenda-service")
    })
    public ResponseEntity<Void> disconnectByPatient() {
        String patientId = getCurrentUserId();
        log.info("Patient {} requesting disconnection from nutritionist", patientId);
        linkingUseCase.unlinkPatient(patientId);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/nutritionist/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Desvincular paciente desde nutriólogo", description = "Rompe la relación clínica de un paciente vinculado desde la cuenta del nutriólogo autenticado.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Paciente desvinculado exitosamente"),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido"),
            @ApiResponse(responseCode = "403", description = "El paciente no pertenece al nutriólogo autenticado"),
            @ApiResponse(responseCode = "404", description = "No existe una vinculación activa con ese paciente"),
            @ApiResponse(responseCode = "503", description = "No fue posible completar la limpieza remota con agenda-service")
    })
    public ResponseEntity<Void> disconnectByNutritionist(
            @Parameter(description = "Identificador del paciente vinculado")
            @PathVariable String patientId) {
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
