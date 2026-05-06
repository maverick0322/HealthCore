package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin User Management", description = "Admin-only endpoints for managed user provisioning")
public class AdminUserManagementController {

    private final AuthService authService;

    @PostMapping
    @Operation(summary = "Create local user as admin", description = "Creates a local user account with the requested role. Requires ADMIN role.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User created successfully",
                    content = @Content(schema = @Schema(implementation = RegisterResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Forbidden for non-admin roles"),
            @ApiResponse(responseCode = "409", description = "Email already exists")
    })
    public ResponseEntity<RegisterResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        User createdUser = authService.createUserByAdmin(request.email(), request.password(), request.role(), request.locale());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("User created successfully", createdUser.getEmail()));
    }

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieves a list of all managed users. Requires ADMIN role.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden for non-admin roles")
    })
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PatchMapping("/{userId}/status")
    @Operation(summary = "Update user status", description = "Enables or disables a user account. Requires ADMIN role.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "403", description = "Forbidden for non-admin roles"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<MessageResponse> updateUserStatus(
            @PathVariable String userId,
            @RequestParam boolean enabled) {
        authService.updateUserStatus(userId, enabled);
        String status = enabled ? "enabled" : "disabled";
        return ResponseEntity.ok(new MessageResponse("User " + status + " successfully"));
    }
}

