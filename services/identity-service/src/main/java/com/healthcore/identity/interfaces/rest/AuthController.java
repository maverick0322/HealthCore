package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerPatient(@Valid @RequestBody RegisterRequest request) {
        log.info("Received HTTP request to register new patient");

        User newUser = authService.registerPatient(request.email(), request.password());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Patient registered successfully",
                        "email", newUser.getEmail()
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received HTTP request to authenticate user");

        Map<String, String> tokens = authService.login(request.email(), request.password());

        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, String>> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        log.info("Received HTTP request to verify user email code");
        authService.verifyCode(request.email(), request.code());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@Valid @RequestBody RefreshRequest request) {
        log.info("Received HTTP request to refresh token pair");
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        log.info("Received HTTP request to request password reset code");
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("message", "Password reset instructions sent if account exists"));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Received HTTP request to confirm password reset");
        authService.resetPassword(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset completed successfully"));
    }
}