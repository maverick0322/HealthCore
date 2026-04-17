package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> registerPatient(@Valid @RequestBody RegisterRequest request) {
        log.info("Received HTTP request to register new patient");

        User newUser = authService.registerPatient(request.email(), request.password());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("Patient registered successfully", newUser.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthTokensResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received HTTP request to authenticate user");

        AuthService.AuthTokens tokens = authService.login(request.email(), request.password());

        return ResponseEntity.ok(AuthTokensResponse.from(tokens));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<MessageResponse> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        log.info("Received HTTP request to verify user email code");
        authService.verifyCode(request.email(), request.code());
        return ResponseEntity.ok(new MessageResponse("Email verified successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokensResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        log.info("Received HTTP request to refresh token pair");
        return ResponseEntity.ok(AuthTokensResponse.from(authService.refresh(request.refreshToken())));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<MessageResponse> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        log.info("Received HTTP request to request password reset code");
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(new MessageResponse("Password reset instructions sent if account exists"));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Received HTTP request to confirm password reset");
        authService.resetPassword(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse("Password reset completed successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUser(@RequestHeader("Authorization") String authorizationHeader) {
        String accessToken = extractBearerToken(authorizationHeader);
        User currentUser = authService.getCurrentUser(accessToken);
        return ResponseEntity.ok(new CurrentUserResponse(
                currentUser.getEmail(),
                currentUser.getRole(),
                currentUser.getProvider(),
                currentUser.isEmailVerified(),
                currentUser.isEnabled()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok(new MessageResponse("Logout completed successfully"));
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid token");
        }
        return authorizationHeader.substring(7).trim();
    }
}