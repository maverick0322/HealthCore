package com.healthcore.identity.application;

import com.healthcore.identity.application.events.PasswordResetRequestedEvent;
import com.healthcore.identity.application.events.UserRegisteredEvent;
import com.healthcore.identity.application.ports.IdentityEventPublisher;
import com.healthcore.identity.domain.AuthProvider;
import com.healthcore.identity.domain.PasswordResetCode;
import com.healthcore.identity.domain.RefreshTokenOwnership;
import com.healthcore.identity.domain.Role;
import com.healthcore.identity.domain.User;
import com.healthcore.identity.domain.VerificationCode;
import com.healthcore.identity.domain.exception.BadRequestException;
import com.healthcore.identity.domain.exception.ConflictException;
import com.healthcore.identity.domain.exception.OAuth2ProviderConflictException;
import com.healthcore.identity.domain.exception.TooManyRequestsException;
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
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String ACCESS_TOKEN_KEY = "accessToken";
    private static final String REFRESH_TOKEN_KEY = "refreshToken";
    private static final String TOKEN_TYPE = "Bearer";
    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
    private static final String TOO_MANY_LOGIN_ATTEMPTS_MESSAGE = "Too many failed login attempts. Please try again later.";
    private static final int VERIFICATION_CODE_TTL_MINUTES = 15;
    private static final int RESET_CODE_TTL_MINUTES = 15;
    private static final int REFRESH_TOKEN_TTL_HOURS = 24;
    private static final long ACCESS_TOKEN_EXPIRES_IN_MS = 300_000L;
    private static final long REFRESH_TOKEN_EXPIRES_IN_MS = 86_400_000L;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_EMAIL_LENGTH = 254;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 72;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,72}$");

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;
    private final Environment environment;
    private final java.util.Optional<com.healthcore.identity.infrastructure.testing.DevEmailCodeStore> devEmailCodeStore;
    private final IdentityEventPublisher identityEventPublisher;

    public User registerPatient(String email, String plainPassword) {
        return registerLocalUser(email, plainPassword, Role.PATIENT, "es");
    }

    public User registerLocalUser(String email, String plainPassword, Role requestedRole, String locale) {
        validateEmail(email, "Email is required");
        validatePassword(plainPassword, "Password is required");
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
                .createdAt(Instant.now())
                .build();

        User savedUser = userRepository.save(newUser);
        VerificationCodeDetails verificationCodeDetails = createVerificationCode(savedUser);
        publishUserRegistered(savedUser, verificationCodeDetails, true, locale);
        log.info("Local user registered successfully with ID: {}", savedUser.getId());

        return savedUser;
    }

    public User createUserByAdmin(String email, String plainPassword, Role requestedRole, String locale) {
        validateEmail(email, "Email is required");
        validatePassword(plainPassword, "Password is required");
        Role role = requestedRole == null ? Role.PATIENT : requestedRole;
        log.info("Admin provisioning local user with email: {} and role: {}", email, role);

        if (role == Role.ADMIN) {
            log.warn("Admin provisioning rejected. Cannot create another ADMIN.");
            throw new BadRequestException("Admins cannot create other administrators");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("Admin provisioning rejected. Email already exists: {}", email);
            throw new ConflictException("Email is already registered in HealthCore");
        }

        User newUser = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(plainPassword))
                .role(role)
                .provider(AuthProvider.LOCAL)
                .emailVerified(false)
                .enabled(true)
                .createdAt(Instant.now())
                .build();

        User savedUser = userRepository.save(newUser);
        VerificationCodeDetails verificationCodeDetails = createVerificationCode(savedUser);
        publishUserRegistered(savedUser, verificationCodeDetails, true, locale);
        log.info("Admin provisioned user successfully with ID: {}", savedUser.getId());

        return savedUser;
    }

    public User updateUserStatus(String userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        user.setEnabled(enabled);
        User savedUser = userRepository.save(user);
        log.info("Admin updated user status. User ID: {}, new status: {}", userId, enabled ? "Enabled" : "Disabled");
        return savedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public AuthTokens login(String email, String plainPassword) {
        log.info("Authentication attempt for user: {}", email);
        String loginKey = normalizeLoginKey(email);

        if (loginAttemptService.isBlocked(loginKey)) {
            throw new TooManyRequestsException(TOO_MANY_LOGIN_ATTEMPTS_MESSAGE);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Authentication failed. User not found for email: {}", email);
                    loginAttemptService.recordFailedAttempt(loginKey);
                    return new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
                });

        if (!user.isEnabled()) {
            log.warn("Authentication failed. User account is disabled for email: {}", email);
            loginAttemptService.recordFailedAttempt(loginKey);
            throw new UnauthorizedException("User account is disabled");
        }

        if (!passwordEncoder.matches(plainPassword, user.getPasswordHash())) {
            log.warn("Authentication failed. Password mismatch for email: {}", email);
            loginAttemptService.recordFailedAttempt(loginKey);
            throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }

        loginAttemptService.recordSuccessfulAttempt(loginKey);

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        persistRefreshToken(user, refreshToken);

        log.debug("JWT tokens generated successfully for user: {}", email);

        return buildTokenResponse(accessToken, refreshToken);
    }

    public AuthTokens loginWithProvider(String email, AuthProvider provider) {
        User user = userRepository.findByEmailAndProvider(email, provider)
                .orElseGet(() -> provisionSocialUser(email, provider));

        if (!user.isEnabled()) {
            log.warn("Authentication failed. User account is disabled for email: {}", email);
            throw new UnauthorizedException("User account is disabled");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        persistRefreshToken(user, refreshToken);

        return buildTokenResponse(accessToken, refreshToken);
    }

    public void verifyCode(String email, String code) {
        VerificationCode verificationCode = verificationCodeRepository
                .findByEmailAndCodeHash(email, hashValue(code))
                .filter(storedCode -> storedCode.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired verification code"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid verification request"));

        user.setEmailVerified(true);
        user.setVerifiedAt(Instant.now());
        userRepository.save(user);
        verificationCodeRepository.deleteByEmail(email);

        log.info("Email verified successfully for user: {}", verificationCode.getEmail());
    }

    public AuthTokens refresh(String refreshToken) {
        String email = jwtUtil.extractEmail(refreshToken);
        String currentTokenHash = hashValue(refreshToken);

        RefreshTokenOwnership currentOwnership = refreshTokenRepository.findByTokenHash(currentTokenHash)
                .filter(token -> !token.isRevoked())
                .filter(token -> token.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("User account is disabled");
        }

        String newAccessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        String newTokenHash = hashValue(newRefreshToken);

        boolean revoked = refreshTokenRepository.revokeIfActive(currentOwnership.getTokenHash(), newTokenHash);
        if (!revoked) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        persistRefreshToken(user, newRefreshToken);

        return buildTokenResponse(newAccessToken, newRefreshToken);
    }

    public User getCurrentUser(String accessToken) {
        String email = jwtUtil.extractEmail(accessToken);
        return getCurrentUserByEmail(email);
    }

    public User getCurrentUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE));
    }

    public void logout(String refreshToken) {
        String tokenHash = hashValue(refreshToken);
        RefreshTokenOwnership tokenOwnership = refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(token -> !token.isRevoked())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        refreshTokenRepository.revokeByTokenHash(tokenOwnership.getTokenHash(), null);
        log.info("Refresh token revoked for email: {}", tokenOwnership.getEmail());
    }

    public void requestPasswordReset(String email, String locale) {
        validateEmail(email, "Email is required");
        Optional<User> userOptional = userRepository.findByEmailAndProvider(email, AuthProvider.LOCAL);

        if (userOptional.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", email);
            return;
        }

        User user = userOptional.get();
        String code = generateNumericCode();

        passwordResetCodeRepository.deleteByEmail(email);
        Instant expiresAt = Instant.now().plus(RESET_CODE_TTL_MINUTES, ChronoUnit.MINUTES);
        passwordResetCodeRepository.save(PasswordResetCode.builder()
                .userId(user.getId())
                .email(email)
                .codeHash(hashValue(code))
            .expiresAt(expiresAt)
                .createdAt(Instant.now())
                .build());

        publishPasswordResetRequested(email, code, expiresAt, locale);

        // Placeholder integration point for notifier adapter.
        log.info("Password reset code generated for user: {}", email);
        if (shouldLogSensitiveCodes()) {
            log.info("--------------------------------------------------");
            log.info("DEVELOPMENT MODE: Password Reset Code for {}", email);
            log.info("Code: {}", code);
            log.info("--------------------------------------------------");
            
            // Save to testing store if available
            devEmailCodeStore.ifPresent(store -> store.savePasswordResetCode(email, code));
        }
    }

    public void resetPassword(String email, String code, String newPassword, String locale) {
        validateEmail(email, "Email is required");
        validatePassword(newPassword, "New password is required");
        PasswordResetCode passwordResetCode = passwordResetCodeRepository
                .findByEmailAndCodeHash(email, hashValue(code))
                .filter(storedCode -> storedCode.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired password reset code"));

        User user = userRepository.findByEmailAndProvider(email, AuthProvider.LOCAL)
                .orElseThrow(() -> new UnauthorizedException("Invalid password reset request"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetCodeRepository.deleteByEmail(email);

        log.info("Password reset completed for user: {}", passwordResetCode.getEmail());
    }

    private VerificationCodeDetails createVerificationCode(User user) {
        String code = generateNumericCode();
        Instant expiresAt = Instant.now().plus(VERIFICATION_CODE_TTL_MINUTES, ChronoUnit.MINUTES);
        verificationCodeRepository.deleteByEmail(user.getEmail());
        verificationCodeRepository.save(VerificationCode.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .codeHash(hashValue(code))
                .expiresAt(expiresAt)
                .createdAt(Instant.now())
                .build());

        // Placeholder integration point for notifier adapter.
        log.info("Verification code generated for user: {}", user.getEmail());
        if (shouldLogSensitiveCodes()) {
            log.info("--------------------------------------------------");
            log.info("DEVELOPMENT MODE: Verification Code for {}", user.getEmail());
            log.info("Code: {}", code);
            log.info("--------------------------------------------------");
            
            // Save to testing store if available
            devEmailCodeStore.ifPresent(store -> store.saveVerificationCode(user.getEmail(), code));
        }

        return new VerificationCodeDetails(code, expiresAt);
    }

    private void persistRefreshToken(User user, String refreshToken) {
        refreshTokenRepository.save(RefreshTokenOwnership.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .tokenHash(hashValue(refreshToken))
                .expiresAt(Instant.now().plus(REFRESH_TOKEN_TTL_HOURS, ChronoUnit.HOURS))
                .revoked(false)
                .createdAt(Instant.now())
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
                    throw new OAuth2ProviderConflictException(
                            "Email is already registered with a different authentication provider",
                            existing.getProvider(),
                            provider
                    );
                });

        User newSocialUser = User.builder()
                .email(email)
                .passwordHash(null)
                .role(Role.PATIENT)
                .provider(provider)
                .emailVerified(true)
                .verifiedAt(Instant.now())
                .enabled(true)
                .createdAt(Instant.now())
                .build();

        User savedSocialUser = userRepository.save(newSocialUser);
        publishUserRegistered(savedSocialUser, null, false, "es");
        log.info("Social user provisioned successfully for email: {} with provider: {}", email, provider);
        return savedSocialUser;
    }

    private boolean shouldLogSensitiveCodes() {
        return environment != null && environment.acceptsProfiles(Profiles.of("dev", "local"));
    }

    private void publishUserRegistered(User savedUser, VerificationCodeDetails verificationCodeDetails, boolean emailVerificationRequired, String locale) {
        try {
            Instant createdAt = savedUser.getCreatedAt() == null ? Instant.now() : savedUser.getCreatedAt();
            identityEventPublisher.publishUserRegistered(new UserRegisteredEvent(
                    savedUser.getId(),
                    savedUser.getEmail(),
                    savedUser.getRole().name(),
                    createdAt.toString(),
                    emailVerificationRequired,
                    verificationCodeDetails == null ? null : verificationCodeDetails.code(),
                    verificationCodeDetails == null ? null : verificationCodeDetails.expiresAt().toString(),
                    locale != null ? locale : "es"
            ));
        } catch (RuntimeException ex) {
            log.warn("Failed to publish user registered event for userId={} email={}", savedUser.getId(), savedUser.getEmail(), ex);
        }
    }

    private void publishPasswordResetRequested(String email, String code, Instant expiresAt, String locale) {
        try {
            identityEventPublisher.publishPasswordResetRequested(new PasswordResetRequestedEvent(
                    email,
                    code,
                    expiresAt.toString(),
                    locale != null ? locale : "es"
            ));
        } catch (RuntimeException ex) {
            log.warn("Failed to publish password reset event for email={}", email, ex);
        }
    }

    private record VerificationCodeDetails(String code, Instant expiresAt) {
    }

    private String normalizeLoginKey(String email) {
        return email == null ? "" : email.trim().toLowerCase();
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

    private void validateEmail(String email, String message) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException(message);
        }
        String trimmed = email.trim();
        if (trimmed.length() > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.matcher(trimmed).matches()) {
            throw new BadRequestException("Invalid email format");
        }
    }

    private void validatePassword(String password, String message) {
        if (password == null || password.isBlank()) {
            throw new BadRequestException(message);
        }
        if (password.length() < MIN_PASSWORD_LENGTH || password.length() > MAX_PASSWORD_LENGTH) {
            throw new BadRequestException("Password does not meet the required length");
        }
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BadRequestException("Password does not meet complexity requirements");
        }
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
