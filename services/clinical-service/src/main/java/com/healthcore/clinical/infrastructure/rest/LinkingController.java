package com.healthcore.clinical.infrastructure.rest;

import java.time.Duration;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.port.in.LinkingUseCase;
import com.healthcore.clinical.infrastructure.rest.dto.AlreadyLinkedErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.ApiErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.GenerateCodeResponse;
import com.healthcore.clinical.infrastructure.rest.dto.LinkPatientRequest;
import com.healthcore.clinical.infrastructure.rest.dto.UnauthorizedErrorResponseDoc;
import com.healthcore.clinical.infrastructure.rest.dto.ValidationErrorResponseDoc;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/clinical/linking")
@Tag(name = "Clinical Linking", description = "Operations for linking and unlinking patients with nutritionists")
public class LinkingController {

    private static final Logger log = LoggerFactory.getLogger(LinkingController.class);

    private final LinkingUseCase linkingUseCase;

    public LinkingController(LinkingUseCase linkingUseCase) {
        this.linkingUseCase = linkingUseCase;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Generate linking code", description = "Creates a temporary code that a patient can use to link with the authenticated nutritionist.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Linking code generated successfully",
                    content = @Content(schema = @Schema(implementation = GenerateCodeResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "A unique linking code could not be generated",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<GenerateCodeResponse> generateCode() {
        String nutritionistId = getCurrentUserId();
        log.info("Generating linking code for nutritionist: {}", nutritionistId);
        LinkingCode code = linkingUseCase.generateLinkingCode(nutritionistId);

        return ResponseEntity.ok(toGenerateCodeResponse(code));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Get current linking code", description = "Returns the active linking code for the authenticated nutritionist or 204 when there is no active code.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Active linking code returned successfully",
                    content = @Content(schema = @Schema(implementation = GenerateCodeResponse.class))),
            @ApiResponse(responseCode = "204", description = "There is no active linking code"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
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
    @Operation(summary = "Link patient with code", description = "Links the authenticated patient with a nutritionist using a valid temporary linking code.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Patient linked successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired linking code",
                    content = @Content(schema = @Schema(
                            oneOf = {ValidationErrorResponseDoc.class, ApiErrorResponseDoc.class}
                    ))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Patient is already linked to another nutritionist",
                    content = @Content(schema = @Schema(implementation = AlreadyLinkedErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> connectPatient(@Valid @RequestBody LinkPatientRequest request) {
        String patientId = getCurrentUserId();
        log.info("Patient {} attempting to link with code: {}", patientId, request.getCode());
        linkingUseCase.linkPatient(patientId, request.getCode());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/patient")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Unlink my nutritionist", description = "Removes the clinical relationship between the authenticated patient and the current nutritionist and triggers the related cleanup.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Link removed successfully or no active link existed"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Patient role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "Patient clinical profile not found",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "503", description = "Remote cleanup with agenda-service could not be completed",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> disconnectByPatient() {
        String patientId = getCurrentUserId();
        log.info("Patient {} requesting disconnection from nutritionist", patientId);
        linkingUseCase.unlinkPatient(patientId);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/disconnect/nutritionist/{patientId}")
    @PreAuthorize("hasRole('NUTRITIONIST')")
    @Operation(summary = "Unlink patient as nutritionist", description = "Removes the clinical relationship for a linked patient from the authenticated nutritionist account.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Patient unlinked successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token",
                    content = @Content(schema = @Schema(implementation = UnauthorizedErrorResponseDoc.class))),
            @ApiResponse(responseCode = "403", description = "Nutritionist role required",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "404", description = "There is no active link for the requested patient profile",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "409", description = "Patient does not belong to the authenticated nutritionist",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class))),
            @ApiResponse(responseCode = "503", description = "Remote cleanup with agenda-service could not be completed",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponseDoc.class)))
    })
    public ResponseEntity<Void> disconnectByNutritionist(
            @Parameter(description = "Identifier of the linked patient")
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
