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
}