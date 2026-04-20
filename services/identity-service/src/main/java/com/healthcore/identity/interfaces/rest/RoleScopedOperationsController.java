package com.healthcore.identity.interfaces.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Role Operations", description = "Domain role-scoped endpoints for patient, nutritionist, and admin operations")
public class RoleScopedOperationsController {

    @GetMapping("/patients/home")
    @Operation(summary = "Patient dashboard", description = "Patient-only sample operation to validate role boundaries.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Allowed for patient"),
            @ApiResponse(responseCode = "403", description = "Forbidden for non-patient roles")
    })
    public ResponseEntity<MessageResponse> patientHome(Authentication authentication) {
        return ResponseEntity.ok(new MessageResponse("Patient operation allowed for " + authentication.getName()));
    }

    @GetMapping("/nutritionists/home")
    @Operation(summary = "Nutritionist dashboard", description = "Nutritionist-only sample operation to validate role boundaries.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Allowed for nutritionist"),
            @ApiResponse(responseCode = "403", description = "Forbidden for non-nutritionist roles")
    })
    public ResponseEntity<MessageResponse> nutritionistHome(Authentication authentication) {
        return ResponseEntity.ok(new MessageResponse("Nutritionist operation allowed for " + authentication.getName()));
    }

    @GetMapping("/admin/home")
    @Operation(summary = "Admin dashboard", description = "Admin-only sample operation to validate role boundaries.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Allowed for admin"),
            @ApiResponse(responseCode = "403", description = "Forbidden for non-admin roles")
    })
    public ResponseEntity<MessageResponse> adminHome(Authentication authentication) {
        return ResponseEntity.ok(new MessageResponse("Admin operation allowed for " + authentication.getName()));
    }
}


