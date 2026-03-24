package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.application.AuthService;
import com.healthcore.identity.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerPatient(@RequestBody RegisterRequest request) {
        try {
            User newUser = authService.registerPatient(request.email(), request.password());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Paciente registrado exitosamente", "email", newUser.getEmail()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Error procesando la solicitud: " + e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error interno del servidor. Intente más tarde."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Map<String, String> tokens = authService.login(request.email(), request.password());
            return ResponseEntity.ok(tokens);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Error durante la autenticación."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error interno del servidor. Intente más tarde."));
        }
    }
}