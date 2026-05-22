package com.healthcore.identity.infrastructure.config;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.manualdb.seed", name = "enabled", havingValue = "true")
public class ManualDbSeedRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.manualdb.seed.patient-email:patient.seed@healthcore.com}")
    private String patientEmail;

    @Value("${app.manualdb.seed.patient-password:}")
    private String patientPassword;

    @Value("${app.manualdb.seed.nutritionist-email:nutritionist.seed@healthcore.com}")
    private String nutritionistEmail;

    @Value("${app.manualdb.seed.nutritionist-password:}")
    private String nutritionistPassword;

    @Value("${app.manualdb.seed.admin-email:admin@healthcore.com}")
    private String adminEmail;

    @Value("${app.manualdb.seed.admin-password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedLocalUserIfMissing(patientEmail, patientPassword, Role.PATIENT);
        seedLocalUserIfMissing(nutritionistEmail, nutritionistPassword, Role.NUTRITIONIST);
        seedLocalUserIfMissing(adminEmail, adminPassword, Role.ADMIN);
    }

    private void seedLocalUserIfMissing(String email, String rawPassword, Role role) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalStateException("Manual DB seed password is required for role " + role);
        }

        if (userRepository.findByEmail(email).isPresent()) {
            log.info("manualdb seed skipped for emailHash={} (already exists)", hash(email));
            return;
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .provider(AuthProvider.LOCAL)
                .emailVerified(true)
                .verifiedAt(Instant.now())
                .enabled(true)
                .createdAt(Instant.now())
                .build();

        userRepository.save(user);
        log.info("manualdb seed user created: emailHash={} role={}", hash(email), role);
    }

    private String hash(String value) {
        return value == null ? "unknown" : Integer.toHexString(value.hashCode());
    }
}
