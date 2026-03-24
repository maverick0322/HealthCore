package com.healthcore.identity.application;

import com.healthcore.identity.domain.User;
import com.healthcore.identity.infrastructure.persistence.UserDocument;
import com.healthcore.identity.infrastructure.persistence.UserRepository;
import com.healthcore.identity.infrastructure.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public User registerPatient(String email, String plainPassword) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email ya registrado en HealthCore");
        }

        String hashedPassword = passwordEncoder.encode(plainPassword);

        UserDocument newUserDoc = new UserDocument();
        newUserDoc.setEmail(email);
        newUserDoc.setPasswordHash(hashedPassword);
        newUserDoc.setRole(User.Role.PATIENT);
        newUserDoc.setActive(true);
        newUserDoc.setCreatedAt(LocalDateTime.now());

        UserDocument savedDoc = userRepository.save(newUserDoc);
        return new User(savedDoc.getId(), savedDoc.getEmail(), savedDoc.getPasswordHash(), savedDoc.getRole(), savedDoc.isActive(), savedDoc.getCreatedAt());
    }

    public Map<String, String> login(String email, String plainPassword) {
        UserDocument user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));

        if (!passwordEncoder.matches(plainPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
        );
    }
}