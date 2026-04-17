package com.healthcore.identity.application;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import com.healthcore.identity.domain.repository.UserRepository;
import com.healthcore.identity.infrastructure.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String ACCESS_TOKEN_KEY = "accessToken";
    private static final String REFRESH_TOKEN_KEY = "refreshToken";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public User registerPatient(String email, String plainPassword) {
        log.info("Attempting to register patient with email: {}", email);

        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("Registration rejected. Email already exists: {}", email);
            throw new ConflictException("Email is already registered in HealthCore");
        }

        User newUser = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(plainPassword))
                .role(Role.PATIENT)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Patient registered successfully with ID: {}", savedUser.getId());

        return savedUser;
    }

    public Map<String, String> login(String email, String plainPassword) {
        log.info("Authentication attempt for user: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Authentication failed. User not found for email: {}", email);
                    return new UnauthorizedException("Invalid credentials");
                });

        if (!passwordEncoder.matches(plainPassword, user.getPasswordHash())) {
            log.warn("Authentication failed. Password mismatch for email: {}", email);
            throw new UnauthorizedException("Invalid credentials");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        log.debug("JWT tokens generated successfully for user: {}", email);

        return Map.of(
                ACCESS_TOKEN_KEY, accessToken,
                REFRESH_TOKEN_KEY, refreshToken
        );
    }
}