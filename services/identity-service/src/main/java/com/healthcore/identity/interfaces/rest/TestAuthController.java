package com.healthcore.identity.interfaces.rest;

import com.healthcore.identity.infrastructure.testing.DevEmailCodeStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/test/auth")
@Profile({"dev", "local"})
@RequiredArgsConstructor
public class TestAuthController {

    private final DevEmailCodeStore devEmailCodeStore;

    @GetMapping("/verification-code/{email}")
    public ResponseEntity<Map<String, String>> getVerificationCode(@PathVariable String email) {
        String code = devEmailCodeStore.getVerificationCode(email);
        if (code == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("code", code));
    }

    @GetMapping("/reset-code/{email}")
    public ResponseEntity<Map<String, String>> getPasswordResetCode(@PathVariable String email) {
        String code = devEmailCodeStore.getPasswordResetCode(email);
        if (code == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("code", code));
    }
}
