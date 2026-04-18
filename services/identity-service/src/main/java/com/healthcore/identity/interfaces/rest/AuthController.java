package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Identity endpoints for registration, login, token lifecycle and account recovery")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register local user", description = "Registers a new patient or nutritionist account using email and password.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = RegisterResponse.class))),
            @ApiResponse(responseCode = "409", description = "Email already exists"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<RegisterResponse> registerPatient(@Valid @RequestBody RegisterRequest request) {
        log.info("Received HTTP request to register new local user");

        User newUser = authService.registerLocalUser(request.email(), request.password(), request.role());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("User registered successfully", newUser.getEmail()));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with local credentials", description = "Authenticates a local user and returns JWT access/refresh tokens.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authenticated successfully",
                    content = @Content(schema = @Schema(implementation = AuthTokensResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<AuthTokensResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received HTTP request to authenticate user");

        AuthService.AuthTokens tokens = authService.login(request.email(), request.password());

        return ResponseEntity.ok(AuthTokensResponse.from(tokens));
    }

    @PostMapping("/verify-code")
    @Operation(summary = "Verify email code", description = "Validates email verification code and marks account as verified.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Code verified",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired code"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<MessageResponse> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        log.info("Received HTTP request to verify user email code");
        authService.verifyCode(request.email(), request.code());
        return ResponseEntity.ok(new MessageResponse("Email verified successfully"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token pair", description = "Rotates refresh token and issues a new access token pair.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token pair refreshed",
                    content = @Content(schema = @Schema(implementation = AuthTokensResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid refresh token"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<AuthTokensResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        log.info("Received HTTP request to refresh token pair");
        return ResponseEntity.ok(AuthTokensResponse.from(authService.refresh(request.refreshToken())));
    }

    @PostMapping("/password-reset/request")
    @Operation(summary = "Request password reset", description = "Generates password-reset instructions for local accounts.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Request accepted",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<MessageResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        log.info("Received HTTP request to request password reset code");
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(new MessageResponse("Password reset instructions sent if account exists"));
    }

    @PostMapping("/password-reset/confirm")
    @Operation(summary = "Confirm password reset", description = "Updates password using a valid reset code.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset completed",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired code"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Received HTTP request to confirm password reset");
        authService.resetPassword(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse("Password reset completed successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns current authenticated user profile using the security principal extracted from JWT.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Current user returned",
                    content = @Content(schema = @Schema(implementation = CurrentUserResponse.class))),
            @ApiResponse(responseCode = "401", description = "Missing or invalid token")
    })
    public ResponseEntity<CurrentUserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new UnauthorizedException("Invalid token");
        }

        User currentUser = authService.getCurrentUserByEmail(authentication.getName());
        return ResponseEntity.ok(new CurrentUserResponse(
                currentUser.getEmail(),
                currentUser.getRole(),
                currentUser.getProvider(),
                currentUser.isEmailVerified(),
                currentUser.isEnabled()
        ));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current session", description = "Revokes refresh token so it cannot be used again.")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout completed",
                    content = @Content(schema = @Schema(implementation = MessageResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid refresh token"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok(new MessageResponse("Logout completed successfully"));
    }
}