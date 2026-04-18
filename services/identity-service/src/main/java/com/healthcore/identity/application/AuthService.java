package com.healthcore.identity.application;

import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.PasswordResetCode;
import com.healthcore.identity.domain.RefreshTokenOwnership;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.VerificationCode;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.UnauthorizedException;
import com.healthcore.identity.domain.repository.PasswordResetCodeRepository;
import com.healthcore.identity.domain.repository.RefreshTokenRepository;
import com.healthcore.identity.domain.repository.UserRepository;
import com.healthcore.identity.domain.repository.VerificationCodeRepository;
import com.healthcore.identity.infrastructure.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String ACCESS_TOKEN_KEY = "accessToken";
    private static final String REFRESH_TOKEN_KEY = "refreshToken";
    private static final String TOKEN_TYPE = "Bearer";
    private static final int VERIFICATION_CODE_TTL_MINUTES = 15;
    private static final int RESET_CODE_TTL_MINUTES = 15;
    private static final int REFRESH_TOKEN_TTL_HOURS = 24;
    private static final long ACCESS_TOKEN_EXPIRES_IN_MS = 300_000L;
    private static final long REFRESH_TOKEN_EXPIRES_IN_MS = 86_400_000L;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final Environment environment;

    public User registerPatient(String email, String plainPassword) {
        return registerLocalUser(email, plainPassword, Role.PATIENT);
    }

    public User registerLocalUser(String email, String plainPassword, Role requestedRole) {
        Role role = sanitizeSelfRegistrationRole(requestedRole);
        log.info("Attempting to register local user with email: {} and role: {}", email, role);

        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("Registration rejected. Email already exists: {}", email);
            throw new ConflictException("Email is already registered in HealthCore");
        }

        User newUser = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(plainPassword))
                .role(role)
                .provider(AuthProvider.LOCAL)
                .emailVerified(false)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(newUser);
        createVerificationCode(savedUser);
        log.info("Local user registered successfully with ID: {}", savedUser.getId());

        return savedUser;
    }

    public AuthTokens login(String email, String plainPassword) {
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
        persistRefreshToken(user, refreshToken);

        log.debug("JWT tokens generated successfully for user: {}", email);

        return buildTokenResponse(accessToken, refreshToken);
    }

    public AuthTokens loginWithProvider(String email, AuthProvider provider) {
        User user = userRepository.findByEmailAndProvider(email, provider)
                .orElseGet(() -> provisionSocialUser(email, provider));

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        persistRefreshToken(user, refreshToken);

        return buildTokenResponse(accessToken, refreshToken);
    }

    public void verifyCode(String email, String code) {
        VerificationCode verificationCode = verificationCodeRepository
                .findByEmailAndCodeHash(email, hashValue(code))
                .filter(storedCode -> storedCode.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired verification code"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid verification request"));

        user.setEmailVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
        verificationCodeRepository.deleteByEmail(email);

        log.info("Email verified successfully for user: {}", verificationCode.getEmail());
    }

    public AuthTokens refresh(String refreshToken) {
        String email = jwtUtil.extractEmail(refreshToken);
        String currentTokenHash = hashValue(refreshToken);

        RefreshTokenOwnership currentOwnership = refreshTokenRepository.findByTokenHash(currentTokenHash)
                .filter(token -> !token.isRevoked())
                .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        String newAccessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        String newTokenHash = hashValue(newRefreshToken);

        refreshTokenRepository.revokeByTokenHash(currentOwnership.getTokenHash(), newTokenHash);
        persistRefreshToken(user, newRefreshToken);

        return buildTokenResponse(newAccessToken, newRefreshToken);
    }

    public User getCurrentUser(String accessToken) {
        String email = jwtUtil.extractEmail(accessToken);
        return getCurrentUserByEmail(email);
    }

    public User getCurrentUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
    }

    public void logout(String refreshToken) {
        String tokenHash = hashValue(refreshToken);
        RefreshTokenOwnership tokenOwnership = refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(token -> !token.isRevoked())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        refreshTokenRepository.revokeByTokenHash(tokenOwnership.getTokenHash(), null);
        log.info("Refresh token revoked for email: {}", tokenOwnership.getEmail());
    }

    public void requestPasswordReset(String email) {
        Optional<User> userOptional = userRepository.findByEmailAndProvider(email, AuthProvider.LOCAL);

        if (userOptional.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", email);
            return;
        }

        User user = userOptional.get();
        String code = generateNumericCode();

        passwordResetCodeRepository.deleteByEmail(email);
        passwordResetCodeRepository.save(PasswordResetCode.builder()
                .userId(user.getId())
                .email(email)
                .codeHash(hashValue(code))
                .expiresAt(LocalDateTime.now().plusMinutes(RESET_CODE_TTL_MINUTES))
                .createdAt(LocalDateTime.now())
                .build());

        // Placeholder integration point for notifier adapter.
        log.info("Password reset code generated for user: {}", email);
        if (shouldLogSensitiveCodes()) {
            log.debug("Password reset code for {} is {}", email, code);
        }
    }

    public void resetPassword(String email, String code, String newPassword) {
        PasswordResetCode passwordResetCode = passwordResetCodeRepository
                .findByEmailAndCodeHash(email, hashValue(code))
                .filter(storedCode -> storedCode.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired password reset code"));

        User user = userRepository.findByEmailAndProvider(email, AuthProvider.LOCAL)
                .orElseThrow(() -> new UnauthorizedException("Invalid password reset request"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetCodeRepository.deleteByEmail(email);

        log.info("Password reset completed for user: {}", passwordResetCode.getEmail());
    }

    private void createVerificationCode(User user) {
        String code = generateNumericCode();
        verificationCodeRepository.deleteByEmail(user.getEmail());
        verificationCodeRepository.save(VerificationCode.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .codeHash(hashValue(code))
                .expiresAt(LocalDateTime.now().plusMinutes(VERIFICATION_CODE_TTL_MINUTES))
                .createdAt(LocalDateTime.now())
                .build());

        // Placeholder integration point for notifier adapter.
        log.info("Verification code generated for user: {}", user.getEmail());
        if (shouldLogSensitiveCodes()) {
            log.debug("Verification code for {} is {}", user.getEmail(), code);
        }
    }

    private void persistRefreshToken(User user, String refreshToken) {
        refreshTokenRepository.save(RefreshTokenOwnership.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .tokenHash(hashValue(refreshToken))
                .expiresAt(LocalDateTime.now().plusHours(REFRESH_TOKEN_TTL_HOURS))
                .revoked(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String generateNumericCode() {
        int randomValue = SECURE_RANDOM.nextInt(900_000) + 100_000;
        return String.valueOf(randomValue);
    }

    private String hashValue(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to hash sensitive value", e);
        }
    }

    private User provisionSocialUser(String email, AuthProvider provider) {
        userRepository.findByEmail(email)
                .filter(existing -> existing.getProvider() != provider)
                .ifPresent(existing -> {
                    throw new ConflictException("Email is already registered with a different authentication provider");
                });

        User newSocialUser = User.builder()
                .email(email)
                .passwordHash(null)
                .role(Role.PATIENT)
                .provider(provider)
                .emailVerified(true)
                .verifiedAt(LocalDateTime.now())
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User savedSocialUser = userRepository.save(newSocialUser);
        log.info("Social user provisioned successfully for email: {} with provider: {}", email, provider);
        return savedSocialUser;
    }

    private boolean shouldLogSensitiveCodes() {
        return environment != null && environment.acceptsProfiles(Profiles.of("dev", "local"));
    }

    private Role sanitizeSelfRegistrationRole(Role requestedRole) {
        Role role = requestedRole == null ? Role.PATIENT : requestedRole;

        if (role == Role.ADMIN) {
            throw new UnauthorizedException("Self-registration with ADMIN role is not allowed");
        }

        return role;
    }

    private AuthTokens buildTokenResponse(String accessToken, String refreshToken) {
        return new AuthTokens(
                accessToken,
                refreshToken,
                TOKEN_TYPE,
                ACCESS_TOKEN_EXPIRES_IN_MS,
                REFRESH_TOKEN_EXPIRES_IN_MS
        );
    }

    public record AuthTokens(
            String accessToken,
            String refreshToken,
            String tokenType,
            long accessTokenExpiresInMs,
            long refreshTokenExpiresInMs
    ) {
        public Map<String, String> toLegacyMap() {
            return Map.of(
                    ACCESS_TOKEN_KEY, accessToken,
                    REFRESH_TOKEN_KEY, refreshToken
            );
        }
    }
}