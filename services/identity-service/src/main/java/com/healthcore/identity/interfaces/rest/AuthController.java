package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerPatient(@RequestBody RegisterRequest request) {
        try {
            User newUser = authService.registerPatient(request.email(), request.password());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Paciente registrado exitosamente con correo: " + newUser.getEmail());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
}